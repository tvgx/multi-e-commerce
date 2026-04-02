import requests

class ApiClient:
    def __init__(self, base_url):
        self.base_url = base_url
        self.token = None

    def login(self, username, password):
        # Implement JWT login
        pass

    def push_config(self, ui_config, shop_id=None):
        headers = {"Authorization": f"Bearer {self.token}"} if self.token else {}
        # Implement push API request
        pass

    def pull_config(self, config_id):
        headers = {"Authorization": f"Bearer {self.token}"} if self.token else {}
        # Implement pull API request
        pass
