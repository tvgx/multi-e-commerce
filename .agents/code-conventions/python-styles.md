# Python (cli-tool)

- Python 3.10+. Dùng `venv` + `requirements.txt` (venv gitignore).
- Type hints cho hàm public; docstring kiểu Google.
- Format `black`, lint `flake8`. Test `pytest`, file `test_*.py`.
- Naming: `snake_case` (hàm/biến), `PascalCase` (class), hằng `UPPER_SNAKE`.
- Không hardcode secret/URL — đọc từ env/config; đóng kết nối DB/HTTP đúng cách.
- Tác vụ lớn (batch/crawl): dùng stream/generator, tránh nạp hết vào RAM.
