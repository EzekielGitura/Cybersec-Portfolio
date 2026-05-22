(() => {
  let canvas = document.querySelector("#homeParticleCanvas") || document.querySelector(".site-particle-bg");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "homeParticleCanvas";
    canvas.setAttribute("aria-hidden", "true");
    document.body.prepend(canvas);
  }
  canvas.classList.add("site-particle-bg");

  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  const particles = [];
  const maxParticles = 3200;
  const particleColor = { r: 126, g: 231, b: 135 };

  let width = 0;
  let height = 0;
  let dpr = 1;
  let sphereRad = 280;
  let fLen = 360;
  let zMax = 358;
  let projCenterX = 0;
  let projCenterY = 0;
  let sphereCenterZ = -283;
  let zeroAlphaDepth = -780;
  let outsidePadding = 80;
  let turnAngle = 0;
  let lastTime = performance.now();
  let spawnAccumulator = 0;
  let animationFrame = 0;

  function resizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    sphereRad = Math.max(300, Math.min(Math.max(width * 0.86, height * 0.74), 1800));
    fLen = Math.max(720, width * 2, height * 1.35);
    zMax = fLen - 2;
    projCenterX = width * 0.5;
    projCenterY = height * 0.5;
    sphereCenterZ = -3 - sphereRad;
    zeroAlphaDepth = -Math.max(900, sphereRad * 2.8);
    outsidePadding = Math.max(90, width * 0.06);
  }

  function addParticle() {
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(Math.random() * 2 - 1);
    const x0 = sphereRad * Math.sin(phi) * Math.cos(theta);
    const y0 = sphereRad * Math.sin(phi) * Math.sin(theta);
    const z0 = sphereRad * Math.cos(phi);

    particles.push({
      x: x0,
      y: y0,
      z: sphereCenterZ + z0,
      velX: 0.002 * x0,
      velY: 0.002 * y0,
      velZ: 0.002 * z0,
      age: 0,
      attack: 50,
      hold: 50,
      decay: 110,
      stuckTime: 90 + Math.random() * 20,
      alpha: 0,
      dead: false
    });
  }

  function particleAlpha(particle) {
    const { age, attack, hold, decay } = particle;
    if (age < attack) {
      return age / attack;
    }
    if (age < attack + hold) {
      return 1;
    }
    if (age < attack + hold + decay) {
      return 1 - (age - attack - hold) / decay;
    }
    particle.dead = true;
    return 0;
  }

  function drawFrame(now) {
    const delta = Math.min((now - lastTime) / 16.67, 2.4);
    lastTime = now;

    context.clearRect(0, 0, width, height);
    context.globalCompositeOperation = "lighter";
    context.shadowColor = "rgba(126, 231, 135, 0.48)";
    context.shadowBlur = 9;

    spawnAccumulator += 16 * delta;
    while (spawnAccumulator >= 1 && particles.length < maxParticles) {
      addParticle();
      spawnAccumulator -= 1;
    }

    turnAngle = (turnAngle + (2 * Math.PI * delta) / 1200) % (2 * Math.PI);
    const sinAngle = Math.sin(turnAngle);
    const cosAngle = Math.cos(turnAngle);

    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const particle = particles[index];
      particle.age += delta;

      if (particle.age > particle.stuckTime) {
        particle.velX += 0.08 * delta * (Math.random() * 2 - 1);
        particle.velY += 0.08 * delta * (Math.random() * 2 - 1);
        particle.velZ += 0.08 * delta * (Math.random() * 2 - 1);
        particle.x += particle.velX * delta;
        particle.y += particle.velY * delta;
        particle.z += particle.velZ * delta;
      }

      const rotX = cosAngle * particle.x + sinAngle * (particle.z - sphereCenterZ);
      const rotZ = -sinAngle * particle.x + cosAngle * (particle.z - sphereCenterZ) + sphereCenterZ;
      const scale = fLen / (fLen - rotZ);
      const projX = rotX * scale + projCenterX;
      const projY = particle.y * scale + projCenterY;
      const alpha = particleAlpha(particle);

      const outside =
        projX > width + outsidePadding ||
        projX < -outsidePadding ||
        projY < -outsidePadding ||
        projY > height + outsidePadding ||
        rotZ > zMax;

      if (outside || particle.dead) {
        particles.splice(index, 1);
        continue;
      }

      let depthAlpha = 1 - rotZ / zeroAlphaDepth;
      depthAlpha = Math.max(0, Math.min(depthAlpha, 1));
      const finalAlpha = depthAlpha * alpha * 0.86;
      const radius = Math.max(0.8, scale * 2.8);

      context.fillStyle = `rgba(${particleColor.r}, ${particleColor.g}, ${particleColor.b}, ${finalAlpha})`;
      context.beginPath();
      context.arc(projX, projY, radius, 0, 2 * Math.PI);
      context.fill();
    }

    animationFrame = window.requestAnimationFrame(drawFrame);
  }

  function start() {
    lastTime = performance.now();
    if (!animationFrame) {
      animationFrame = window.requestAnimationFrame(drawFrame);
    }
  }

  function stop() {
    window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  });
  start();
})();
