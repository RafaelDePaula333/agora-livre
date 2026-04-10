# Guia Técnico de Data Safety e Billing - Agora Livre

## 1. Mapeamento para o Formulário "Segurança de Dados"
No Play Console, siga este mapa exato para evitar rejeições:

| Campo no Console | O que marcar | Descrição para o Google |
| :--- | :--- | :--- |
| **Identificadores Pessoais** | Coletado | "Coletamos o e-mail do usuário para fins de autenticação e gerenciamento de conta." |
| **Saúde e Condicionamento** | Coletado | "Coletamos dados sobre o vício monitorado e métricas de sobriedade para fornecer as funcionalidades principais do app." |
| **Atividade no App** | Coletado | "Monitoramos check-ins e registros de recaída para gerar relatórios de progresso ao usuário." |
| **Criptografia** | Sim | "Todos os dados são transmitidos via HTTPS e armazenados com criptografia em repouso no Supabase." |
| **Exclusão de Dados** | Sim | "Oferecemos uma opção dentro do app para o usuário excluir sua conta e todos os dados associados permanentemente." |

## 2. Configurações do Google Play Billing
- **Assinaturas:** Criar dois produtos no Play Console: `agora_livre_mensal` e `agora_livre_anual`.
- **Preços:** Garanta que o preço exibido no app (PremiumScreen) seja dinâmico, buscando do Google Play via `react-native-iap`.
- **Políticas:** Nunca ofereça preços menores para pagamento via Pix/Cartão fora do app.

## 3. Checklist de Permissões (Android)
No seu `app.json`, mantenha apenas:
- `INTERNET`
- `ACCESS_NETWORK_STATE`
- `SCHEDULE_EXACT_ALARM` (Apenas se as notificações motivacionais forem offline).

**Aviso:** Adicionar permissões como `READ_CONTACTS` ou `LOCATION` sem uma funcionalidade clara levará à rejeição imediata do app na categoria saúde.
