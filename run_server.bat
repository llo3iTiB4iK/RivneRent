!/bin/bash

# Команда для клонування репозиторію
git clone https://github.com/llo3iTiB4iK/RivneRent

# Перехід у папку DjangoProject
cd RivneRent/DjangoProject

# Встановлення необхідних бібліотек
pip install -r requirements.txt

# Перехід у папку конфігурації додатку
cd DjangoProject

# Створення файлу .env
python -c "with open('.env', 'w') as file: file.write('SECRET_KEY=django-insecure-96)$vlf+w2hb%_bkr(5mptn2&&o9oo---l_7g&4-it@=5jnqv3\nDEBUG=True\nAWS_ACCESS_KEY_ID=AKIA4YJ3RNQL4F5ZVO5Z\nAWS_SECRET_ACCESS_KEY=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\nAWS_STORAGE_BUCKET_NAME=rivnerent\nAWS_S3_REGION_NAME=eu-north-1\nAWS_DEFAULT_ACL=public-read')"

# Повернення на один рівень вище
cd ..

# Запуск додатку
python manage.py runserver
