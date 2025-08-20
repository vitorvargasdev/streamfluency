# StreamFluency 🌍

Aprenda idiomas assistindo vídeos no YouTube com legendas duplas e tradução instantânea.

## 📥 Instalação

Baixe o arquivo `.xpi` mais recente em [Releases](https://github.com/yourusername/streamfluency/releases) e arraste para o Firefox.

## 🚀 Desenvolvimento

### Setup

```bash
# Instalar dependências
pnpm install

# Desenvolvimento com hot reload
npm run firefox
```

### Build e Distribuição

```bash
# Build de produção
npm run build

# Criar pacote ZIP
npm run package

# Assinar extensão (requer credenciais AMO)
npm run sign
```

### Configurar Assinatura

1. Obtenha credenciais em: https://addons.mozilla.org/developers/addon/api/key/
2. Configure as variáveis de ambiente:

```bash
export AMO_JWT_ISSUER="user:xxxx:xxx"
export AMO_JWT_SECRET="seu-secret-aqui"
```

3. Execute: `npm run sign`

## 📝 Licença

MIT
