const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');

const minioClient = new S3Client({
  region: 'us-east-1',
  endpoint: 'http://localhost:9000',
  forcePathStyle: true,
  credentials: {
    accessKeyId: 'minioadmin',
    secretAccessKey: 'minioadmin',
  },
});

const files = [
  'Homepage.png',
  'Products page.png',
  'Cart.png',
  'Profile.png'
];

async function run() {
  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const file = `/home/lordfeeder/workspaces/multi-e-commerce/docs/master-template/pages/${filename}`;
    const fileStream = fs.createReadStream(file);
    
    const key = `default-${i + 1}.png`; // Changed to .png
    
    try {
      await minioClient.send(new PutObjectCommand({
        Bucket: 'assets',
        Key: key,
        Body: fileStream,
        ContentType: 'image/png'
      }));
      console.log(`✅ Uploaded ${filename} as ${key}`);
    } catch (err) {
      console.error(`❌ Failed ${filename}:`, err.message);
    }
  }
}

run();
