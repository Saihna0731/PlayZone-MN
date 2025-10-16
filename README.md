# My Map App - PC Center Management System

Монгол улсын PC center болон тоглоомын төвүүдийг удирдах вэб аппликейшн.

## 🚀 Онцлогууд

- 🗺️ **Интерактив газрын зураг** - Leaflet ашиглан бодит цагийн газрын зураг
- 🎮 **PC Center удирдлага** - Төвүүдийг бүртгэх, засах, устгах
- ❤️ **Дуртай системе** - Хэрэглэгчид дуртай төвүүдээ хадгалах
- 👤 **Хэрэглэгчийн систем** - JWT ашиглан нэвтрэх/гарах (User/Admin)
- 💰 **Үнийн удирдлага** - Standard/VIP/Stage өрөөний үнэ
- 📱 **Responsive дизайн** - Бүх төхөөрөмж дээр ажиллана
- 🖼️ **Зураг upload** - Logo болон зургийг автомат compress хийнэ
- 🔍 **Хайлт & шүүлт** - Нэр, хаяг, ангиллаар хайх

## 🛠️ Технологи

### Frontend
- **React 18** + Hooks
- **React Router v6** - Client-side routing
- **Leaflet** (React-Leaflet) - Газрын зураг
- **Axios** - HTTP client
- **React Icons** - Icon library
- **CSS3** - Glass effect design

### Backend
- **Node.js** + Express.js
- **MongoDB** + Mongoose
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Multer** - File upload
- **CORS** - Cross-origin requests

## 📋 Шаардлага

- Node.js (v16 ба түүнээс дээш)
- MongoDB (v4.4+)
- Git
- Modern браузер

## 🚀 Суулгах заавар

### 1. Repository clone хийх
```bash
git clone [repository-url]
cd my-map-app
```

### 2. Backend тохируулах
```bash
cd server
npm install

# Environment файл тохируулах
cp .env.example .env
```

**server/.env файлд дараах утгуудыг тохируулна уу:**
```env
MONGODB_URI=mongodb://localhost:27017/my-map-app
JWT_SECRET=өөрийн-нууц-түлхүүр-энд-бичээрэй
PORT=8080
```

### 3. Frontend суулгах
```bash
cd ..
npm install
```

### 4. Ажиллуулах

**Backend эхлүүлэх:**
```bash
cd server
npm start
# Серверж http://localhost:8080 дээр ажиллана
```

**Frontend эхлүүлэх (шинэ terminal):**
```bash
npm start
# Аппаз http://localhost:3000 дээр нээнэ
```

### 5. Админ хэрэглэгч үүсгэх
```bash
cd server
node createAdmin.js
```

## 👥 Багийн хамтын ажиллагаа

### Git Workflow
1. **Branch үүсгэх:** `git checkout -b feature/шинэ-онцлог`
2. **Код бичих:** Өөрчлөлт хийх
3. **Commit:** `git commit -m "feat: шинэ онцлог нэмэв"`
4. **Push:** `git push origin feature/шинэ-онцлог`
5. **Pull Request үүсгэх**
6. **Code Review** хийлгэх
7. **Merge** хийх

### Branch Strategy
- `main` - 🔒 Production (зөвхөн stable код)
- `develop` - 🔄 Development салбар
- `feature/*` - ✨ Шинэ онцлог хөгжүүлэх
- `fix/*` - 🐛 Алдаа засах

### Commit Convention
```
feat: шинэ онцлог нэмэх
fix: алдаа засах
docs: баримт бичиг
style: код форматлах
refactor: код сайжруулах
test: тест нэмэх
```

## 🔒 Аюулгүй байдал

### ⚠️ АНХААРАХ ЗҮЙЛС
- `.env` файлыг GitHub дээр хэзээ ч commit НУ хийх
- Admin нууц үгээ хамгаалах
- JWT secret-ыг өөрчилж ашиглах
- MongoDB connection string нуух

### Зөвшөөрөл
- **Repository:** Private байх ёстой
- **Collaborators:** Зөвхөн багийн гишүүд
- **Branch protection:** main салбарыг хамгаалах

## 📱 Ашиглах заавар

### Хэрэглэгчийн үүрэг
- Газрын зураг үзэх
- PC center хайх
- Дуртай төвүүдээ хадгалах
- Дэлгэрэнгүй мэдээлэл үзэх

### Админы үүрэг
- Шинэ төв нэмэх
- Мэдээлэл засах/устгах
- Үнийн мэдээлэл оруулах
- Хэрэглэгчдийг удирдах

## 🐛 Алдаа засах

### Түгээмэл асуудал
1. **MongoDB холбогдохгүй:** MongoDB server ажиллаж байгаа эсэхийг шалгана уу
2. **Port эзлэгдсэн:** Өөр порт ашигла эсвэл процессыг зогсоо
3. **JWT алдаа:** .env файлд JWT_SECRET тохируулсан эсэхийг шалгана уу

### Лог шалгах
```bash
# Backend лог
cd server && npm start

# Frontend лог  
npm start
```

## 🤝 Хувь нэмэр оруулах

1. Issue үүсгэх эсвэл багтай ярилцах
2. Feature branch үүсгэх
3. Код бичиж тест хийх
4. Pull Request үүсгэх
5. Code review хүлээх

---

**📞 Багийн холбоо барих:** Slack эсвэл email ашиглана уу

**⚖️ Лиценз:** MIT - Багийн private project

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
