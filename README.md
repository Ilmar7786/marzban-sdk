# marzban-sdk

Fully typed and implementing all marzban methods

---

## Installation

Using npm:

```shell
npm install marzban-sdk
```

## Usage

```javascript
const marzban = new MarzbanSDK({
  baseUrl: "https://example.com",
  password: "password",
  username: "username",
});

marzban.admin.getCurrentAdmin();
```

## License

Distributed under the MIT License. See `LICENSE` for more information.
