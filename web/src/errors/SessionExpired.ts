export class SessionExpired extends Error {
  constructor() {
    super("Sessão expirada");
    this.name = "SessionExpired";
  }
}
