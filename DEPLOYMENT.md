# 部署说明

本项目已配置 GitHub Actions 自动部署 demo 到 GitHub Pages。

## 🚀 自动部署

当代码推送到 `main` 或 `master` 分支时，GitHub Actions 会自动：

1. **代码质量检查**：运行 linting 和构建测试
2. **构建库文件**：构建 `@nova-fe/textarea` 组件库
3. **构建演示**：构建 demo 应用
4. **部署到 GitHub Pages**：自动部署到 GitHub Pages

## ⚙️ 启用 GitHub Pages

要启用 GitHub Pages，请按以下步骤操作：

### 1. 在 GitHub 仓库中启用 Pages

1. 进入 GitHub 仓库页面
2. 点击 **Settings** 标签
3. 在左侧菜单中找到 **Pages**
4. 在 **Source** 部分选择 **GitHub Actions**
5. 保存设置

### 2. 确保仓库权限

确保 GitHub Actions 有足够的权限：

1. 在仓库 **Settings** 中
2. 点击 **Actions** → **General**
3. 在 **Workflow permissions** 部分
4. 选择 **Read and write permissions**
5. 勾选 **Allow GitHub Actions to create and approve pull requests**
6. 保存设置

### 3. 触发部署

部署会在以下情况自动触发：

- 推送代码到 `main` 或 `master` 分支
- 创建针对 `main` 或 `master` 分支的 Pull Request（仅构建，不部署）
- 手动触发（在 Actions 页面点击 "Run workflow"）

## 📱 访问演示

部署成功后，可以通过以下 URL 访问演示：

```
https://[你的用户名].github.io/textarea/
```

例如：`https://leslie.github.io/textarea/`

## 🔧 自定义配置

### 修改基础路径

如果你的仓库名不是 `textarea`，需要修改 `demo/vite.config.ts` 中的 `base` 配置：

```typescript
base: process.env.NODE_ENV === 'production' ? '/你的仓库名/' : '/',
```

### 自定义域名

如果要使用自定义域名：

1. 在 `demo/public/` 目录下创建 `CNAME` 文件
2. 在文件中写入你的域名，如：`textarea.yourdomain.com`
3. 在域名提供商处配置 CNAME 记录指向 `[用户名].github.io`

## 🐛 故障排除

### 部署失败

1. 检查 GitHub Actions 日志
2. 确保所有依赖都在 `package.json` 中正确声明
3. 确保构建命令能在本地正常运行

### 页面显示空白

1. 检查浏览器控制台是否有错误
2. 确认 `base` 路径配置正确
3. 检查资源文件路径是否正确

### 样式或资源加载失败

1. 确认所有静态资源都在 `demo/public/` 目录下
2. 检查 Vite 配置中的 `assetsDir` 设置
3. 确认没有使用绝对路径引用资源

## 📊 构建状态

可以在仓库的 Actions 页面查看构建状态和日志。每次推送都会触发新的构建。

## 🔄 本地预览

在本地预览生产构建：

```bash
# 构建库
npm run build

# 构建演示
cd demo
npm run build

# 预览
npm run preview
```

## 📝 更新演示

要更新演示内容：

1. 修改 `demo/src/` 下的文件
2. 推送到 `main` 或 `master` 分支
3. GitHub Actions 会自动重新部署

演示会在几分钟内更新完成。
