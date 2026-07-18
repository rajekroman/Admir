const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export class ScreenEffects {
  constructor({ root, damage, heal, flash, banner, bannerTitle, bannerText }) {
    this.root = root;
    this.damage = damage;
    this.heal = heal;
    this.flash = flash;
    this.banner = banner;
    this.bannerTitle = bannerTitle;
    this.bannerText = bannerText;
    this.damageStrength = 0;
    this.healStrength = 0;
    this.flashStrength = 0;
    this.bannerTimer = 0;
  }

  pulseDamage(strength = 0.65) {
    this.damageStrength = Math.max(this.damageStrength, clamp(strength, 0.2, 1));
  }

  pulseHeal(strength = 0.5) {
    this.healStrength = Math.max(this.healStrength, clamp(strength, 0.2, 1));
  }

  pulseFlash(strength = 0.45) {
    this.flashStrength = Math.max(this.flashStrength, clamp(strength, 0.1, 1));
  }

  announce(title, text = "", duration = 3.3) {
    if (!this.banner) return;
    this.bannerTitle.textContent = title || "";
    this.bannerText.textContent = text || "";
    this.banner.classList.add("is-visible");
    this.bannerTimer = duration;
  }

  update(dt) {
    this.damageStrength = Math.max(0, this.damageStrength - dt * 1.8);
    this.healStrength = Math.max(0, this.healStrength - dt * 1.5);
    this.flashStrength = Math.max(0, this.flashStrength - dt * 2.8);
    this.damage?.style.setProperty("--effect-opacity", this.damageStrength.toFixed(3));
    this.heal?.style.setProperty("--effect-opacity", this.healStrength.toFixed(3));
    this.flash?.style.setProperty("--effect-opacity", this.flashStrength.toFixed(3));
    this.root?.classList.toggle("is-under-attack", this.damageStrength > 0.1);
    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
      if (this.bannerTimer <= 0) this.banner?.classList.remove("is-visible");
    }
  }
}
