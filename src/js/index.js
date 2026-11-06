const generateButton = document.querySelector("#generate-password");
const passwordOutput = document.querySelector("#generated-password");
const copyButton = document.querySelector("#copy-password");
const lengthInput = document.querySelector("#length");
const lengthValue = document.querySelector("#length-value");
const uppercaseInput = document.querySelector("#uppercase");
const lowercaseInput = document.querySelector("#lowercase");
const numbersInput = document.querySelector("#numbers");
const symbolsInput = document.querySelector("#symbols");
const feedback = document.querySelector("#feedback");
const placeholder = document.querySelector("#password-placeholder");
const strengthText = document.querySelector("#strength-text");
const strengthMeter = document.querySelector("#strength-meter");

let currentPassword = "";

const characterSets = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%&*()-_=+[]{}:;,.?/<>"
};

function secureRandomIndex(max) {
  if (!Number.isInteger(max) || max <= 0) {
    throw new RangeError("Limite aleatório inválido.");
  }

  const cryptoApi = window.crypto;
  if (!cryptoApi || typeof cryptoApi.getRandomValues !== "function") {
    throw new Error("Este navegador não oferece geração criptográfica segura.");
  }

  const range = 0x100000000;
  const cutoff = range - (range % max);
  const buffer = new Uint32Array(1);
  let value;

  do {
    cryptoApi.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= cutoff);

  return value % max;
}

function getSelectedSets() {
  const selected = [];
  if (uppercaseInput.checked) selected.push(characterSets.uppercase);
  if (lowercaseInput.checked) selected.push(characterSets.lowercase);
  if (numbersInput.checked) selected.push(characterSets.numbers);
  if (symbolsInput.checked) selected.push(characterSets.symbols);
  return selected;
}

function shuffleSecurely(characters) {
  const result = [...characters];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = secureRandomIndex(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result.join("");
}

function createPassword(length, sets) {
  const allCharacters = sets.join("");
  const requiredCharacters = sets.map((set) => set[secureRandomIndex(set.length)]);
  const remaining = [];

  while (requiredCharacters.length + remaining.length < length) {
    remaining.push(allCharacters[secureRandomIndex(allCharacters.length)]);
  }

  return shuffleSecurely([...requiredCharacters, ...remaining]);
}

function estimateStrength(length, sets) {
  const poolSize = sets.reduce((total, set) => total + set.length, 0);
  const bits = length * Math.log2(poolSize);
  if (bits >= 100) return { label: "VERY STRONG", level: 5 };
  if (bits >= 75) return { label: "STRONG", level: 4 };
  if (bits >= 55) return { label: "GOOD", level: 3 };
  if (bits >= 35) return { label: "FAIR", level: 2 };
  return { label: "LOW", level: 1 };
}

function setFeedback(message, type = "") {
  feedback.textContent = message;
  feedback.className = `feedback ${type}`.trim();
}

function generatePassword() {
  const length = Number(lengthInput.value);
  const sets = getSelectedSets();

  if (!sets.length) {
    setFeedback("ERROR — SELECT AT LEAST ONE CHARACTER SET.", "error");
    return;
  }

  try {
    currentPassword = createPassword(length, sets);
    passwordOutput.textContent = currentPassword;
    copyButton.disabled = false;
    placeholder.textContent = `${length} CHARACTERS GENERATED`;

    const strength = estimateStrength(length, sets);
    strengthText.textContent = strength.label;
    [...strengthMeter.children].forEach((segment, index) => {
      segment.classList.toggle("active", index < strength.level);
    });

    setFeedback("KEY GENERATED LOCALLY — READY TO COPY.", "success");
  } catch (error) {
    currentPassword = "";
    passwordOutput.textContent = "••••••••••••••••";
    copyButton.disabled = true;
    setFeedback("ERROR — SECURE GENERATION IS NOT AVAILABLE.", "error");
  }
}

lengthInput.addEventListener("input", () => {
  lengthValue.textContent = lengthInput.value;
});

generateButton.addEventListener("click", generatePassword);

document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && event.target.tagName !== "BUTTON") {
    event.preventDefault();
    generatePassword();
  }
});

copyButton.addEventListener("click", async () => {
  if (!currentPassword) return;
  try {
    await navigator.clipboard.writeText(currentPassword);
    setFeedback("KEY COPIED TO CLIPBOARD.", "success");
    copyButton.innerHTML = "<span>✓</span> COPIED";
    window.setTimeout(() => {
      copyButton.innerHTML = "<span>▣</span> COPY KEY";
    }, 1400);
  } catch {
    setFeedback("CLIPBOARD BLOCKED — SELECT AND COPY THE KEY MANUALLY.", "error");
  }
});

[uppercaseInput, lowercaseInput, numbersInput, symbolsInput].forEach((input) => {
  input.addEventListener("change", () => {
    if (!getSelectedSets().length) {
      setFeedback("SELECT AT LEAST ONE CHARACTER SET.", "error");
    } else {
      setFeedback("CONFIGURATION UPDATED — GENERATE A NEW KEY.");
    }
  });
});

lengthValue.textContent = lengthInput.value;
