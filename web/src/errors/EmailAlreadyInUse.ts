export class EmailAlreadyInUse extends Error {
  constructor() {
    super("Email já cadastrado");
    this.name = "EmailAlreadyInUse";
  }
}
