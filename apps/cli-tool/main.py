import os
import argparse
from api_client import ApiClient

def main():
    parser = argparse.ArgumentParser(description="CLI Tool for managing UI JSON configs")
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Push command
    push_parser = subparsers.add_parser("push", help="Push UI config to API")
    push_parser.add_parser("file", help="Path to JSON file to push")

    # Pull command
    pull_parser = subparsers.add_parser("pull", help="Pull UI config from API")
    pull_parser.add_parser("id", help="ID of the UI config to pull")

    args = parser.parse_args()
    client = ApiClient(base_url="http://localhost:3000")

    if args.command == "push":
        print(f"Pushing {args.file} to API...")
        # TODO: Implement push logic
    elif args.command == "pull":
        print(f"Pulling config {args.id} from API...")
        # TODO: Implement pull logic
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
