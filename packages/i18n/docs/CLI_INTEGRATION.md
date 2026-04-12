# CLI Integration Guide

Guide for integrating @ecommerce/i18n into Node.js CLI applications (cli-tool)

## Installation

The i18n package is already available in the monorepo for CLI use.

```bash
npm install @ecommerce/i18n
```

## Setup

### 1. Initialize in CLI Entry Point

**apps/cli-tool/main.py** (or main.ts for TypeScript CLI)

```typescript
import { initializeI18n, getTranslator } from '@ecommerce/i18n';
import * as fs from 'fs';

async function main() {
  // Detect language from:
  // 1. CLI argument: --lang=vi
  // 2. Environment variable: ECOMMERCE_CLI_LANG=vi
  // 3. User's config file: ~/.ecommerce-cli/config.json
  // 4. Default: English

  const args = process.argv;
  let language: 'en' | 'vi' = 'en';

  // Check for --lang flag
  const langArg = args.find((arg) => arg.startsWith('--lang='));
  if (langArg) {
    language = langArg.split('=')[1] as 'en' | 'vi';
  }

  // Check environment variable
  if (process.env.ECOMMERCE_CLI_LANG) {
    language = process.env.ECOMMERCE_CLI_LANG as 'en' | 'vi';
  }

  // Check user config
  const configPath = `${process.env.HOME}/.ecommerce-cli/config.json`;
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    if (config.language && ['en', 'vi'].includes(config.language)) {
      language = config.language;
    }
  }

  // Initialize i18n
  await initializeI18n(language);

  // Get translator for convenient access
  const t = getTranslator(language);

  // Parse and execute commands
  const command = args[2];
  if (command === 'shop') {
    await handleShopCommand(args.slice(3), t);
  } else if (command === 'backup') {
    await handleBackupCommand(args.slice(3), t);
  } else {
    console.log(t.t('common', 'help.title'));
    console.log(t.t('common', 'help.description'));
  }
}

main().catch((error) => {
  const t = getTranslator();
  console.error(t.translateError('internal'));
  process.exit(1);
});
```

## Command Implementation

### Shop Commands

```typescript
import { TranslationService } from '@ecommerce/i18n';

async function handleShopCommand(args: string[], t: TranslationService) {
  const subcommand = args[0];

  switch (subcommand) {
    case 'list':
      await shopList(t);
      break;
    case 'create':
      await shopCreate(args.slice(1), t);
      break;
    case 'get':
      await shopGet(args[1], t);
      break;
    case 'update':
      await shopUpdate(args[1], args.slice(2), t);
      break;
    default:
      console.log(t.t('common', 'help.shop'));
  }
}

async function shopList(t: TranslationService) {
  console.log(t.t('common', 'messages.loading'));

  try {
    const shops = await api.getShops();

    if (shops.length === 0) {
      console.log(t.t('shop', 'messages.noShops'));
      return;
    }

    console.log('\n' + t.t('shop', 'list.title'));
    console.log('─'.repeat(80));

    for (const shop of shops) {
      console.log(`ID: ${shop.id}`);
      console.log(`${t.t('shop', 'labels.name')}: ${shop.name}`);
      console.log(`${t.t('shop', 'labels.domain')}: ${shop.domain}`);
      console.log(`${t.t('shop', 'labels.status')}: ${shop.status}`);
      console.log('─'.repeat(80));
    }

    console.log(`\n${shops.length} ${t.pluralTranslate('shop', 'labels.shops', shops.length)}`);
  } catch (error) {
    console.error(t.translateError('fetch.failed'));
    process.exit(1);
  }
}

async function shopCreate(args: string[], t: TranslationService) {
  // Parse arguments to options
  const options = parseArgs(args);

  if (!options.name || !options.domain) {
    console.error(t.translateValidation('required'));
    console.log(`\n${t.t('common', 'usage')}: shop create --name <name> --domain <domain>`);
    process.exit(1);
  }

  console.log(t.t('common', 'messages.loading'));

  try {
    const shop = await api.createShop({
      name: options.name,
      domain: options.domain,
    });

    console.log(`\n✓ ${t.t('shop', 'messages.created')}`);
    console.log(`ID: ${shop.id}`);
    console.log(`${t.t('shop', 'labels.name')}: ${shop.name}`);
    console.log(`${t.t('shop', 'labels.domain')}: ${shop.domain}`);
  } catch (error) {
    if (error.code === 'DOMAIN_EXISTS') {
      console.error(t.translateError('domain.exists'));
    } else {
      console.error(t.translateError('create.failed'));
    }
    process.exit(1);
  }
}
```

### Backup Commands

```typescript
async function handleBackupCommand(args: string[], t: TranslationService) {
  const subcommand = args[0];

  switch (subcommand) {
    case 'create':
      await backupCreate(args[1], t);
      break;
    case 'list':
      await backupList(args[1], t);
      break;
    case 'restore':
      await backupRestore(args[1], args[2], t);
      break;
    default:
      console.log(t.t('common', 'help.backup'));
  }
}

async function backupCreate(shopId: string, t: TranslationService) {
  console.log(t.t('common', 'messages.creatingBackup'));

  try {
    const backup = await api.createBackup(shopId);

    console.log(`\n✓ ${t.t('order', 'messages.backupCreated')}`);
    console.log(`${t.t('common', 'labels.backupId')}: ${backup.id}`);
    console.log(`${t.t('common', 'labels.size')}: ${backup.size_mb}MB`);
    console.log(`${t.t('common', 'labels.createdAt')}: ${new Date(backup.created_at).toLocaleString()}`);
  } catch (error) {
    console.error(t.translateError('backup.failed'));
    process.exit(1);
  }
}

async function backupRestore(shopId: string, backupId: string, t: TranslationService) {
  // Confirm before restoring
  console.log(t.t('common', 'warnings.dataLoss'));
  console.log(t.t('common', 'prompts.confirmRestore'));

  const answer = await prompt('y/N: ');

  if (answer.toLowerCase() !== 'y') {
    console.log(t.t('common', 'messages.cancelled'));
    return;
  }

  console.log(t.t('common', 'messages.restoring'));

  try {
    const result = await api.restoreBackup(shopId, backupId);

    console.log(`\n✓ ${t.t('order', 'messages.backupRestored')}`);
    console.log(`Restored ${result.records_count} records`);
  } catch (error) {
    console.error(t.translateError('restore.failed'));
    process.exit(1);
  }
}
```

### Health Check Command

```typescript
async function handleHealthCommand(args: string[], t: TranslationService) {
  console.log(t.t('common', 'messages.checking'));

  try {
    const results = await api.healthCheck();

    console.log('\n' + t.t('common', 'labels.healthStatus'));
    console.log('─'.repeat(80));

    let allHealthy = true;

    for (const [service, status] of Object.entries(results)) {
      const icon = status.healthy ? '✓' : '✗';
      console.log(`${icon} ${service}: ${status.message || 'OK'}`);
      if (!status.healthy) allHealthy = false;
    }

    console.log('─'.repeat(80));

    if (allHealthy) {
      console.log(`\n✓ ${t.t('common', 'messages.allHealthy')}`);
    } else {
      console.log(`\n✗ ${t.t('errors', 'healthCheckFailed')}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(t.translateError('health.check.failed'));
    process.exit(1);
  }
}
```

### Batch Operations

```typescript
async function handleBatchCommand(args: string[], t: TranslationService) {
  const csvFile = args[0];

  if (!csvFile) {
    console.error(t.translateValidation('required'));
    console.log(`${t.t('common', 'usage')}: batch create <file.csv>`);
    process.exit(1);
  }

  console.log(t.t('common', 'messages.loading'));

  try {
    // Read and parse CSV
    const operations = parseCSV(csvFile);

    console.log(`\n${operations.length} ${t.pluralTranslate('common', 'labels.operations', operations.length)}`);
    console.log(`${t.t('common', 'prompts.confirm')}`);

    const answer = await prompt('y/N: ');
    if (answer.toLowerCase() !== 'y') {
      console.log(t.t('common', 'messages.cancelled'));
      return;
    }

    // Execute batch
    let successful = 0;
    let failed = 0;

    for (const op of operations) {
      try {
        await api.executeOperation(op);
        successful++;
        console.log(`✓ ${op.name}`);
      } catch (error) {
        failed++;
        console.log(`✗ ${op.name}: ${error.message}`);
      }
    }

    console.log(`\n${t.t('common', 'labels.completed')}: ${successful}/${operations.length}`);
    if (failed > 0) {
      console.log(`${t.t('common', 'labels.failed')}: ${failed}`);
    }
  } catch (error) {
    console.error(t.translateError('batch.failed'));
    process.exit(1);
  }
}
```

## Interactive Prompts

```typescript
import * as prompts from 'prompts';

async function interactiveShopSetup(t: TranslationService) {
  const response = await prompts([
    {
      type: 'text',
      name: 'name',
      message: t.t('shop', 'labels.name'),
      validate: (value) => {
        if (!value) return t.translateValidation('required');
        if (value.length < 3) return t.translateValidation('minLength');
        return true;
      },
    },
    {
      type: 'text',
      name: 'domain',
      message: t.t('shop', 'labels.domain'),
      validate: (value) => {
        if (!value) return t.translateValidation('required');
        if (!isValidDomain(value)) return t.translateValidation('domain.invalid');
        return true;
      },
    },
    {
      type: 'select',
      name: 'category',
      message: t.t('shop', 'labels.category'),
      choices: [
        { title: t.t('shop', 'categories.electronics'), value: 'electronics' },
        { title: t.t('shop', 'categories.fashion'), value: 'fashion' },
        { title: t.t('shop', 'categories.health'), value: 'health' },
      ],
    },
    {
      type: 'confirm',
      name: 'confirm',
      message: t.t('common', 'prompts.confirm'),
      initial: true,
    },
  ]);

  if (response.confirm) {
    return await api.createShop(response);
  } else {
    console.log(t.t('common', 'messages.cancelled'));
  }
}
```

## Configuration Management

```typescript
import * as os from 'os';
import * as path from 'path';

class CLIConfig {
  private configPath: string;
  private config: Record<string, any>;

  constructor() {
    this.configPath = path.join(os.homedir(), '.ecommerce-cli', 'config.json');
    this.load();
  }

  private load() {
    try {
      const content = fs.readFileSync(this.configPath, 'utf-8');
      this.config = JSON.parse(content);
    } catch {
      this.config = {
        language: 'en',
        apiUrl: 'http://localhost:3000',
        theme: 'auto',
      };
    }
  }

  get(key: string, defaultValue?: any) {
    return this.config[key] ?? defaultValue;
  }

  set(key: string, value: any) {
    this.config[key] = value;
    this.save();
  }

  private save() {
    const dir = path.dirname(this.configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
  }
}

// In main()
const config = new CLIConfig();
const language = process.env.ECOMMERCE_CLI_LANG || config.get('language', 'en');
```

## Localized Table Output

```typescript
import * as Table from 'cli-table3';

async function shopList(t: TranslationService) {
  const shops = await api.getShops();

  const table = new Table({
    head: [
      t.t('common', 'labels.id'),
      t.t('shop', 'labels.name'),
      t.t('shop', 'labels.domain'),
      t.t('shop', 'labels.status'),
      t.t('common', 'labels.createdAt'),
    ].map((h) => chalk.cyan(h)),
  });

  for (const shop of shops) {
    table.push([
      shop.id,
      shop.name,
      shop.domain,
      this.getStatusColor(shop.status)(shop.status),
      new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(shop.created_at)),
    ]);
  }

  console.log(table.toString());
}

private getStatusColor(status: string) {
  const colors: Record<string, Function> = {
    active: chalk.green,
    inactive: chalk.gray,
    error: chalk.red,
  };
  return colors[status] || chalk.white;
}
```

## Error Handling

```typescript
class CLIError extends Error {
  constructor(
    public translationKey: string,
    public context?: Record<string, any>,
  ) {
    super(translationKey);
  }
}

async function handleCommand(command: string, args: string[], t: TranslationService) {
  try {
    // ... execute command
  } catch (error) {
    if (error instanceof CLIError) {
      const message = t.translateError(error.translationKey);
      console.error(chalk.red(`✗ ${message}`));
      if (error.context?.details) {
        console.error(chalk.dim(error.context.details));
      }
    } else if (error instanceof Error) {
      console.error(chalk.red(`✗ ${t.translateError('internal')}`));
      console.debug(error.message);
    }
    process.exit(1);
  }
}
```

## Help Text

```typescript
function showHelp(t: TranslationService) {
  console.log(`
${chalk.bold(t.t('common', 'help.title'))}
${t.t('common', 'help.description')}

${chalk.bold(t.t('common', 'help.usage'))}
  ecommerce-cli [command] [options]

${chalk.bold(t.t('common', 'help.commands'))}
  shop      ${t.t('common', 'help.shopDescription')}
  backup    ${t.t('common', 'help.backupDescription')}
  health    ${t.t('common', 'help.healthDescription')}
  batch     ${t.t('common', 'help.batchDescription')}

${chalk.bold(t.t('common', 'help.options'))}
  --lang=en|vi  ${t.t('common', 'help.langOption')}
  --help        ${t.t('common', 'help.showHelp')}
  --version     ${t.t('common', 'help.showVersion')}

${chalk.bold(t.t('common', 'help.examples'))}
  ecommerce-cli shop list
  ecommerce-cli shop create --name "My Store" --domain "mystore.com"
  ecommerce-cli backup create --shop-id abc123
  ecommerce-cli --lang=vi health check
`);
}
```

## Environment Variables

```bash
# Set default language for CLI
export ECOMMERCE_CLI_LANG=vi

# Set API endpoint
export ECOMMERCE_API_URL=https://api.example.com

# Set log level
export ECOMMERCE_CLI_LOG_LEVEL=debug
```

## Best Practices

### ✅ DO

```typescript
// ✅ Use translator for all user messages
console.log(t.t('shop', 'messages.created'));

// ✅ Confirm destructive operations
if (await confirm(t.t('common', 'prompts.confirm'))) {
  // execute
}

// ✅ Use semantic error methods
throw new CLIError('backup.notFound');

// ✅ Format dates/numbers properly
new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US').format(date);
```

### ❌ DON'T

```typescript
// ❌ Hardcode strings
console.log('Shop created successfully');

// ❌ Assume English output
console.log('Error creating backup');

// ❌ Ignore language in formatting
new Date(shop.created_at).toString(); // Displays in local system timezone

// ❌ Mix languages
console.log('Created: ' + t.t('common', 'labels.name'));
```

## Testing

```typescript
describe('CLI Commands', () => {
  let t: TranslationService;

  beforeEach(async () => {
    await initializeI18n('en');
    t = getTranslator('en');
  });

  it('should list shops', async () => {
    const output = await captureOutput(async () => {
      await shopList(t);
    });

    expect(output).toContain(t.t('shop', 'list.title'));
  });

  it('should translate messages', () => {
    const msg = t.t('shop', 'messages.created');
    expect(msg).toBeDefined();
    expect(msg).not.toContain(':'); // Not a translation key
  });
});
```

---

For more info, see the main [README.md](../README.md)
