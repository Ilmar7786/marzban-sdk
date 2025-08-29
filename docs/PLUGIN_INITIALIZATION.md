### **1. Создание SDK с ожиданием инициализации**

```typescript
// ✅ РЕШЕНИЕ: ждем инициализации плагинов
const sdk = await createMarzbanSDK(
  {
    baseUrl: 'https://api.example.com',
    username: 'admin',
    password: 'secret',
    plugins: [slowPlugin, fastPlugin],
  },
  {
    waitForPlugins: true, // Ждать инициализации плагинов
  }
)

// Теперь все плагины гарантированно инициализированы!
const users = await sdk.user.getUsers() // ✅ Обработчики сработают
```

## 📝 Примеры использования

### **Пример 1: Критически важные плагины**

```typescript
// Плагины должны быть готовы перед работой
const sdk = await createMarzbanSDK(
  {
    baseUrl: 'https://api.example.com',
    username: 'admin',
    password: 'secret',
    plugins: [
      authPlugin, // Аутентификация
      loggingPlugin, // Логирование
      cachePlugin, // Кэширование
    ],
  },
  {
    waitForPlugins: true, // Ждать инициализации плагинов
  }
)

// Теперь все критически важные плагины готовы
const users = await sdk.user.getUsers()
```

### **Пример 2: Плагины с медленной инициализацией**

```typescript
const sdk = await createMarzbanSDK(
  {
    plugins: [slowInitPlugin], // 5+ секунд на инициализацию
  },
  {
    waitForPlugins: true, // Ждать инициализации
  }
)

console.log('Плагины готовы!')
const users = await sdk.user.getUsers()
```
