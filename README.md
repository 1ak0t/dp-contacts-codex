# dp-contacts-codex

## Импорт контактов из CSV

На сервере поместите `дп-данные.csv` в корень проекта (рядом с папкой
`restapi`). Из каталога `restapi` выполните:

```powershell
npm ci
npm run import:csv
```

Команда использует `MONGO_URI` и `MONGO_DB_NAME` из `restapi/.env`,
коллекцию `employees`. MongoDB должна быть запущена; запуск API не требуется.
После импорта обновите страницу справочника.

Другой файл и проверка без записи:

```powershell
npm run import:csv -- "C:\import\дп-данные.csv"
npm run import:csv -- --dry-run
```

Формат: UTF-8, разделитель — запятая, заголовки `fio,op,orgUnit,jobTitle,phoneNumber,persEmail,jobType,email`.
Дополнительно поддерживается необязательная колонка `innerPhone` (внутренний телефон).
Кавычки, запятые внутри кавычек и переносы строк поддерживаются.
Все строки проверяются перед подключением к базе; пустое ФИО и неверная
структура отклоняются. Остальные значения сохраняются как строки из файла.

Импорт добавляет записи, не удаляя и не обновляя существующие. Полные
совпадения по всем восьми полям пропускаются, в том числе при повторном
запуске. Изменённая строка считается новым контактом. Запускайте одну команду
импорта за раз. При обрыве записи часть данных может сохраниться; после
устранения причины можно повторить команду. `--dry-run` проверяет только
файл, без подключения к MongoDB. Результат команды показывает количество
добавленных и пропущенных записей.

## Сервер contacts.detail-project.ru

- Домен: `contacts.detail-project.ru`, DNS A-запись на сервер `10.13.2.73`.
- Фронтенд: IIS, `https://contacts.detail-project.ru`, порт 443.
- API: отдельный HTTPS-процесс `npm run dev`, порт 4000.
- MongoDB: на том же сервере, доступ из API через loopback.
- Клиенты: сеть `10.13.2.0/24`.

### Фронтенд

В корне проекта выполните `npm ci`, затем `npm run build`.
При сборке `.env.production` задаёт `VITE_API_URL=https://zeta.detail-project.ru:4000`.
Проверьте, что старые `.env.local`, `.env.production.local` или переменные
окружения не переопределяют это значение.

Скопируйте содержимое `dist` в каталог сайта IIS. Привязка сайта:
HTTPS, IP `10.13.2.73`, порт `443`, имя узла `contacts.detail-project.ru`.
В IIS должны быть включены Static Content, анонимный доступ и документ
по умолчанию `index.html`. После замены сборки обновите страницу с Ctrl+F5.
Сертификат для IIS импортируйте из имеющегося PFX или создайте его из файлов
в `ssl`: private key `ssl/csr_key.txt`, fullchain
`ssl/detail-project.ru.fullchain.crt`.

При обновлении прежнего размещения удалите из каталога сайта старый
`web.config`, добавленный нашим отменённым коммитом IIS, если он там остался.
Если файл содержит другие настройки, уберите только правило `Contacts API`.
В этой схеме браузер обращается напрямую к HTTPS-порту 4000 по маршрутам
`/` и `/auth/*`; прокси `/api` не используется.

### Бэкенд и MongoDB

В каталоге `restapi` выполните `npm ci`. Создайте `.env` из `.env.example`,
если файла ещё нет. В существующем `.env` обновите сетевые параметры:

```dotenv
HOST=0.0.0.0
PORT=4000
HTTPS=true
SSL_KEY_PATH=../ssl/csr_key.txt
SSL_CERT_PATH=../ssl/detail-project.ru.fullchain.crt
SSL_PASSPHRASE=
CORS_ORIGIN=https://contacts.detail-project.ru,http://127.0.0.1:5173,http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27017/
MONGO_DB_NAME=contacts
```

Сохраните действующие `AUTH_LOGIN`, `AUTH_PASSWORD`, `JWT_SECRET`;
при первой настройке замените демонстрационные значения из примера.
Если в базе ещё нет сотрудников-администраторов, доступен системный
администратор из `.env`: логин `admin`, пароль `DP-admin-7mK4-rQ92`
при настройках по умолчанию. После запуска задайте свой `AUTH_PASSWORD`.
Сотрудники-администраторы входят по корпоративному E-Mail.
Запустите MongoDB с существующей базой `contacts` либо перенесите её
резервную копию. Копирование исходников не переносит данные MongoDB.
Если MongoDB требует авторизацию, укажите её в `MONGO_URI`.

Из каталога `restapi` выполните `npm run dev` и оставьте процесс работающим.
После изменения `.env` перезапустите его вручную.

### Доступ из локальной сети

На сервере выполните PowerShell от администратора:

```powershell
New-NetFirewallRule -DisplayName "DP Contacts HTTPS LAN" -Direction Inbound -Action Allow -Protocol TCP -LocalAddress 10.13.2.73 -LocalPort 443 -RemoteAddress 10.13.2.0/24
New-NetFirewallRule -DisplayName "DP Contacts API HTTPS LAN" -Direction Inbound -Action Allow -Protocol TCP -LocalAddress 10.13.2.73 -LocalPort 4000 -RemoteAddress 10.13.2.0/24
```

Это разрешающие правила для нужной подсети. Если требуется доступ только
из неё, проверьте существующие широкие разрешения IIS/Node.js в брандмауэре:
добавление этих правил не сужает другие разрешающие правила.
MongoDB оставьте слушать `127.0.0.1`: клиентам не нужен порт 27017.

### Проверка

1. На сервере откройте `https://zeta.detail-project.ru:4000/health`.
2. С компьютера в `10.13.2.0/24` откройте
   `https://zeta.detail-project.ru:4000/health`: ожидается `{"status":"ok"}`.
3. Откройте `https://zeta.detail-project.ru:4000/`: ожидается JSON с `employees`.
   Этот шаг проверяет и доступ к базе; `/health` базу не проверяет.
4. Откройте `https://contacts.detail-project.ru`, проверьте контакты и вход.
   В Network адрес запросов должен начинаться с `https://zeta.detail-project.ru:4000/`.

Если видите `/api/contacts` на порту 80, загружена прежняя сборка.
Если порт 4000 недоступен, проверьте процесс API, `HOST`, сертификат,
брандмауэр и сеть.
Если вход блокируется CORS, проверьте фактический `CORS_ORIGIN` в `.env`
и перезапустите API. Origin — `https://contacts.detail-project.ru`,
а не IP клиентского компьютера.
