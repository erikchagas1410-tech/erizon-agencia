# Creative Render - Testes Locais

Como testar os novos templates e presets localmente sem chamar o Groq.

1) Rodar o Next em modo dev:

```bash
npm run dev
```

2) Endpoints de exemplos (geram PNG):

- `/api/creative/examples/pain_point` - feed_portrait Erizon
- `/api/creative/examples/benefit` - feed_square Erizon
- `/api/creative/examples/offer` - story Erizon

Abra no navegador ou use `curl` para baixar o PNG. Exemplo:

```bash
curl -o pain_point.png http://localhost:3000/api/creative/examples/pain_point
```

3) Debug visual

Para habilitar o modo debug no preview da renderização do servidor, abra o componente `CreativeTemplateView` no código e passe a prop `debug={true}` ao renderizá-lo localmente (o endpoint de exemplo não ativa debug por padrão).

4) Verificação de exportação fiel

- As dimensões seguem `lib/creative/schema.ts` (1080x1080, 1080x1350, 1080x1920).
- Fontes usadas são carregadas em `lib/creative/render-creative-png.tsx` e precisam estar presentes (dependência do Next interna já configurada).
- Abra o PNG gerado e compare visualmente com o preview no ambiente de desenvolvimento.

5) Notas

- Os exemplos estão em `lib/creative/examples.ts`.
- O fluxo Groq → JSON → template permanece intacto; a rota de exemplo não usa Groq.
