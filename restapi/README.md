# REST API для контактов и авторизации

Node.js + TypeScript backend для контактов сотрудников и авторизации фронтенда.

## Запуск

```bash
npm install
copy .env.example .env
npm run dev
```

По умолчанию API слушает все интерфейсы (`HOST=0.0.0.0`, `PORT=4000`).
В production API запускается по HTTPS с сертификатом из `../ssl`.
Для IIS на порту 443 разрешён Origin `https://contacts.detail-project.ru`.
Обновите существующий `.env` по [инструкции размещения](../README.md).
MongoDB используется по адресу `mongodb://localhost:27017/`, база данных - `contacts`.

## Endpoints

### `GET /health`

Проверка работоспособности.

Production URL: `https://contacts.detail-project.ru:4000/health`.

### `GET /contacts`

Возвращает сотрудников из MongoDB:

```json
{
  "employees": [
    {
      "id": "mongo-object-id",
      "fio": "ФИО",
      "op": "ОП",
      "orgUnit": "Подразделение",
      "jobTitle": "Должность",
      "phoneNumber": "+70000000000",
      "innerPhone": "0012",
      "persEmail": "",
      "jobType": "Основное место работы",
      "email": ""
    }
  ]
}
```

### `POST /contacts`

Создает сотрудника в MongoDB. Требует заголовок:

```http
Authorization: Bearer jwt-token
```

`innerPhone` — необязательная строка внутреннего телефона, без маски мобильного номера.

Обязательные поля: `fio`, `op`, `orgUnit`, `jobTitle`, `phoneNumber`, `jobType`.
`op` должен совпадать с одним из существующих значений, `phoneNumber` - с форматом `+7xxxxxxxxxx`.

### `PUT /contacts/:id`

Обновляет сотрудника в MongoDB. Требует JWT-заголовок и принимает те же поля и правила валидации, что `POST /contacts`.

### `DELETE /contacts/:id`

Удаляет сотрудника из MongoDB. Требует JWT-заголовок.

### `POST /auth/login`

Тело запроса:

```json
{
  "login": "employee@example.com",
  "password": "generated-password"
}
```

Для пустой базы остаётся системный администратор из `.env`: по умолчанию
логин `admin`, пароль `DP-admin-7mK4-rQ92`.

Ответ:

```json
{
  "token": "jwt-token",
  "user": {
    "id": "default-user",
    "login": "admin"
  }
}
```

### `GET /auth/me`

Заголовок:

```http
Authorization: Bearer jwt-token
```

### `POST /auth/logout`

Stateless logout для фронтенда. Клиент должен удалить сохраненный токен.
