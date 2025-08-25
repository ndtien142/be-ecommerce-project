# User Role Permissions

## API Endpoints và Phân Quyền

### 🔐 Authentication Required

Tất cả các endpoint đều yêu cầu authentication token trong header.

### 👥 Role-based Access Control

#### 🟡 **User Role**

**Những gì USER có thể làm:**

- ✅ `GET /user/profile` - Xem profile của chính mình
- ✅ `PUT /user/profile` - Cập nhật profile của chính mình (firstName, lastName, phoneNumber, address, avatarUrl)
- ✅ `GET /user/:id` - Xem profile của chính mình (khi :id = userId của mình)

**Những gì USER KHÔNG thể làm:**

- ❌ Xem danh sách tất cả users
- ❌ Tạo user mới hoặc admin
- ❌ Cập nhật thông tin user khác
- ❌ Xóa hoặc block user khác
- ❌ Thay đổi role của mình hoặc ai khác

#### 🔴 **Admin Role**

**Những gì ADMIN có thể làm:**

- ✅ `GET /user` - Xem danh sách tất cả users
- ✅ `GET /user/:id` - Xem profile của bất kỳ user nào
- ✅ `POST /user` - Tạo user mới (với roleId)
- ✅ `POST /user/admin` - Tạo admin mới
- ✅ `PUT /user/:id` - Cập nhật thông tin bất kỳ user nào
- ✅ `PATCH /user/:id/delete` - Xóa mềm user (set status = 'deleted')
- ✅ `PATCH /user/:id/block` - Block/unblock user
- ✅ `GET /user/profile` - Xem profile của chính mình
- ✅ `PUT /user/profile` - Cập nhật profile của chính mình

### 📋 API Endpoints Summary

| Endpoint           | Method | Admin | User | Description               |
| ------------------ | ------ | ----- | ---- | ------------------------- |
| `/user`            | GET    | ✅    | ❌   | Lấy danh sách users       |
| `/user/profile`    | GET    | ✅    | ✅   | Xem profile hiện tại      |
| `/user/profile`    | PUT    | ✅    | ✅   | Cập nhật profile hiện tại |
| `/user`            | POST   | ✅    | ❌   | Tạo user mới              |
| `/user/admin`      | POST   | ✅    | ❌   | Tạo admin mới             |
| `/user/:id`        | GET    | ✅    | ✅\* | Xem user theo ID          |
| `/user/:id`        | PUT    | ✅    | ❌   | Cập nhật user             |
| `/user/:id/delete` | PATCH  | ✅    | ❌   | Xóa mềm user              |
| `/user/:id/block`  | PATCH  | ✅    | ❌   | Block/unblock user        |

\*User chỉ có thể xem profile của chính mình

### 🛡️ Security Features

1. **Role-based Middleware**: Sử dụng `checkRole(['admin'])` để giới hạn quyền truy cập
2. **User Isolation**: User chỉ có thể xem/sửa thông tin của chính mình
3. **Admin Privileges**: Admin có quyền quản lý tất cả users
4. **Selective Updates**: User chỉ có thể cập nhật các trường an toàn (không thể thay đổi role, status, etc.)

### 🔧 Cách sử dụng

#### Tạo User thường:

```bash
POST /user
Headers:
  Authorization: Bearer <admin_token>
Body: {
  "username": "user1",
  "password": "password123",
  "email": "user1@example.com",
  "roleId": 2,  // Role ID của user
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Tạo Admin:

```bash
POST /user/admin
Headers:
  Authorization: Bearer <admin_token>
Body: {
  "username": "admin1",
  "password": "admin123",
  "email": "admin1@example.com",
  "firstName": "Admin",
  "lastName": "User"
}
```

#### User cập nhật profile:

```bash
PUT /user/profile
Headers:
  Authorization: Bearer <user_token>
Body: {
  "firstName": "John Updated",
  "phoneNumber": "+84123456789"
}
```
