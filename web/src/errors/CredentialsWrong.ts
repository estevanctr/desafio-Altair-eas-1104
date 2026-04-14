export class CredentialsWrong extends Error {
  constructor() {
    super("Email ou senha inválidos");
    this.name = "CredentialsWrong";
  }
}
