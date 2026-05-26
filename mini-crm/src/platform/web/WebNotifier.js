export class WebNotifier {
  constructor(toast) {
    this.toast = toast;
  }

  show(message, tone = "info") {
    this.toast?.show(message, tone);
  }
}
