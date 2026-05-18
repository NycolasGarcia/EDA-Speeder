import os
import logging
from datetime import datetime

_BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_LOG_DIR  = os.path.join(_BASE_DIR, 'logs')
os.makedirs(_LOG_DIR, exist_ok=True)

_log_file = os.path.join(_LOG_DIR, f'errors_{datetime.now().strftime("%Y%m%d")}.log')

_handler = logging.FileHandler(_log_file, encoding='utf-8')
_handler.setLevel(logging.ERROR)
_handler.setFormatter(logging.Formatter(
    '%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
))

app_logger = logging.getLogger('eda_speeder')
app_logger.setLevel(logging.ERROR)
if not app_logger.handlers:
    app_logger.addHandler(_handler)
