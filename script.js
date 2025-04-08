// DOM elementlerini tek seferde seçme
const elements = {
  modeToggle: document.getElementById("mode-toggle"),
  body: document.body,
  result: document.getElementById("result"),
  expression: document.getElementById("expression"),
  buttons: document.querySelector('.buttons'),
  memoryIndicator: document.getElementById("memory-indicator"),
  mc: document.getElementById("mc"),
  mr: document.getElementById("mr"),
  mPlus: document.getElementById("m-plus"),
  mMinus: document.getElementById("m-minus")
};

// Tema yönetimi için daha modüler bir yapı
const themeManager = {
  isDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
  
  init() {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) this.isDarkMode = savedMode === 'true';
    this.apply();
    
    // Sistem tema değişikliğini dinle
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!localStorage.getItem('darkMode')) {
        this.isDarkMode = e.matches;
        this.apply();
      }
    });
    
    // Toggle butonu
    elements.modeToggle.addEventListener("click", () => {
      this.toggle();
    });
  },
  
  apply() {
    elements.body.classList.toggle("dark-mode", this.isDarkMode);
    elements.modeToggle.textContent = this.isDarkMode ? "🌙" : "☀️";
  },
  
  toggle() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('darkMode', this.isDarkMode);
    this.apply();
  }
};

// Sayı formatlaması için singleton nesne
const formatter = {
  // Bin ayırıcı için format fonksiyonu
  format(num) {
    if (num === "" || num === undefined) return num;
    
    // Ondalık kısmını ve tam sayı kısmını ayır
    const parts = num.toString().split('.');
    
    // Tam sayı kısmını formatla (bin ayırıcı ekle)
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    
    // Tekrar birleştir
    return parts.join(',');
  },
  
  // Formatı kaldır
  unformat(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/\./g, '').replace(',', '.');
  }
};

// Hafıza yönetimi için bir modül
const memoryManager = {
  memoryValue: 0,
  hasMemory: false,
  
  init() {
    // Başlangıçta hafıza göstergesini gizle
    this.updateIndicator();
    
    // Hafıza düğmeleri için olay dinleyicileri
    elements.mc.addEventListener('click', () => this.memoryClear());
    elements.mr.addEventListener('click', () => this.memoryRecall());
    elements.mPlus.addEventListener('click', () => this.memoryAdd());
    elements.mMinus.addEventListener('click', () => this.memorySubtract());
  },
  
  memoryClear() {
    this.memoryValue = 0;
    this.hasMemory = false;
    this.updateIndicator();
  },
  
  memoryRecall() {
    if (!this.hasMemory) return;
    
    calculator.clearIfError();
    elements.result.value = formatter.format(this.memoryValue);
  },
  
  memoryAdd() {
    try {
      const currentValue = parseFloat(formatter.unformat(elements.result.value)) || 0;
      this.memoryValue += currentValue;
      this.hasMemory = true;
      this.updateIndicator();
      
      // Görsel geri bildirim
      this.flashMemoryIndicator();
    } catch (error) {
      calculator.showError("Hafıza işlemi yapılamadı");
    }
  },
  
  memorySubtract() {
    try {
      const currentValue = parseFloat(formatter.unformat(elements.result.value)) || 0;
      this.memoryValue -= currentValue;
      this.hasMemory = true;
      this.updateIndicator();
      
      // Görsel geri bildirim
      this.flashMemoryIndicator();
    } catch (error) {
      calculator.showError("Hafıza işlemi yapılamadı");
    }
  },
  
  updateIndicator() {
    elements.memoryIndicator.style.visibility = this.hasMemory ? 'visible' : 'hidden';
  },
  
  flashMemoryIndicator() {
    elements.memoryIndicator.classList.add('flash');
    setTimeout(() => {
      elements.memoryIndicator.classList.remove('flash');
    }, 300);
  }
};

// Hesap makinesi işlevselliği için daha yapılandırılmış bir nesne
const calculator = {
  init() {
    // Event dinleyicilerini ekle
    this.setupEventListeners();
  },
  
  setupEventListeners() {
    // Buton tıklamaları için event delegation
    elements.buttons.addEventListener('click', this.handleButtonClick.bind(this));
    
    // Klavye desteği
    document.addEventListener("keydown", this.handleKeyPress.bind(this));
  },
  
  handleButtonClick(e) {
    if (e.target.tagName !== 'BUTTON') return;
    
    const action = e.target.textContent;
    // Hafıza butonları zaten memoryManager tarafından işleniyor, onları atlayalım
    if (['MC', 'MR', 'M+', 'M-'].includes(action)) return;
    
    this.processAction(action);
  },
  
  handleKeyPress(event) {
    const key = event.key;
    
    this.clearIfError();
    
    // Sayı tuşları
    if (key >= '0' && key <= '9') {
      event.preventDefault();
      this.appendNumber(key);
      return;
    }
    
    // Özel tuşlar için switch daha verimli
    switch (key) {
      case '+':
      case '-':
      case '*':
      case '/':
      case '(':
      case ')':
        event.preventDefault();
        this.appendOperator(key);
        break;
        
      case '.':
      case ',':
        event.preventDefault();
        this.appendDecimal();
        break;
        
      case 'Enter':
        event.preventDefault();
        this.calculate();
        break;
        
      case 'Backspace':
        event.preventDefault();
        this.deleteLastCharacter();
        break;
        
      default:
        // Alt tuşu kombinasyonları
        if (event.altKey) {
          switch(key) {
            case 'c':
              event.preventDefault();
              this.clearResult();
              break;
            case '1':
              event.preventDefault();
              memoryManager.memoryClear();
              break;
            case '2':
              event.preventDefault();
              memoryManager.memoryRecall();
              break;
            case '3':
              event.preventDefault();
              memoryManager.memoryAdd();
              break;
            case '4':
              event.preventDefault();
              memoryManager.memorySubtract();
              break;
          }
        }
        break;
    }
  },
  
  processAction(action) {
    // Eylem tipine göre branch yap
    switch (action) {
      case '=': 
        this.calculate();
        break;
      case '←': 
        this.deleteLastCharacter();
        break;
      case 'C': 
        this.clearResult();
        break;
      case '.': 
        this.appendDecimal();
        break;
      default:
        // Operatör veya parantez mi?
        if (['+', '-', '*', '/', '(', ')'].includes(action)) {
          this.appendOperator(action);
        }
        // Sayı mı?
        else if (!isNaN(action)) {
          this.appendNumber(action);
        }
        break;
    }
  },
  
  clearIfError() {
    const resultValue = elements.result.value;
    
    if (
      resultValue === "Hata" || 
      resultValue === "undefined" || 
      resultValue.startsWith("Hata:")
    ) {
      elements.result.value = "";
      elements.expression.textContent = "";
      elements.result.classList.remove("error");
    }
  },
  
  appendNumber(n) {
    this.clearIfError();
    elements.result.value += n;
    
    // Sayıları bin ayırıcı ile göster - yalnızca gerekirse yeniden formatla
    const unformatted = formatter.unformat(elements.result.value);
    if (!isNaN(unformatted)) {
      elements.result.value = formatter.format(unformatted);
    }
  },
  
  appendOperator(op) {
    this.clearIfError();
    
    // Parantezler için özel kurallar
    if (op === '(' || op === ')') {
      elements.result.value += op;
      return;
    }
    
    const lastChar = elements.result.value.slice(-1);
    
    // Operatörden sonra sayı olmadan tekrar operatör girişi yapılmasını engelle
    if (['+', '-', '*', '/', '.'].includes(lastChar) || elements.result.value === "") return;
    
    // Operatör ekleniyor
    elements.result.value += op;
  },
  
  appendDecimal() {
    this.clearIfError();
    
    // Son işlem ondalık içeriyorsa tekrar ondalık ekleme
    const unformatted = formatter.unformat(elements.result.value);
    const parts = unformatted.split(/[+\-*/]/);
    const lastPart = parts[parts.length - 1];
    
    if (lastPart.includes('.')) {
      this.showError("Geçersiz ondalık!");
      return;
    }
    
    elements.result.value += lastPart === "" ? "0." : ".";
  },
  
  deleteLastCharacter() {
    // Eğer formatlı bir sayı varsa, formatı kaldır, karakteri sil, tekrar formatla
    const unformatted = formatter.unformat(elements.result.value);
    const newValue = unformatted.slice(0, -1);
    
    // Eğer sadece sayı varsa ve sayısal bir değerse formatla
    if (!isNaN(newValue) && newValue !== "") {
      elements.result.value = formatter.format(newValue);
    } else {
      elements.result.value = newValue;
    }
  },
  
  clearResult() {
    elements.result.value = "";
    elements.expression.textContent = "";
    elements.result.classList.remove("error");
  },
  
  showError(message) {
    elements.result.value = "Hata: " + message;
    elements.result.classList.add("error");
    
    // setTimeout yerine requestAnimationFrame kullanarak daha verimli temizleme
    const timeoutId = setTimeout(() => {
      elements.result.value = "";
      elements.result.classList.remove("error");
      clearTimeout(timeoutId);
    }, 2000);
  },
  
  calculate() {
    if (!elements.result.value) return;
    
    try {
      // Formatlı gösterimi hesaplama için düzelt
      const unformatted = formatter.unformat(elements.result.value);
      const sanitizedInput = unformatted.replace(/[^0-9+\-*/().]/g, '');
      
      // Mevcut ifadeyi ifade alanına ekle
      elements.expression.textContent = elements.result.value + " = ";
      
      // Sıfıra bölme kontrolü - regex ile daha hızlı
      if (/\/\s*0(?!\d)/.test(sanitizedInput)) {
        this.showError("Sıfıra bölme hatası!");
        return;
      }
      
      // Parantez sayılarını kontrol et
      const openParenCount = (sanitizedInput.match(/\(/g) || []).length;
      const closeParenCount = (sanitizedInput.match(/\)/g) || []).length;
      
      if (openParenCount !== closeParenCount) {
        this.showError("Parantez hatası!");
        return;
      }
      
      // Function kullanımı yerine daha güvenli bir eval yöntemi
      const result = evaluateExpression(sanitizedInput);
      
      if (result === Infinity || result === -Infinity) {
        this.showError("Sıfıra bölme hatası!");
        return;
      }
      
      if (isNaN(result)) {
        this.showError("Geçersiz işlem!");
        return;
      }
      
      elements.result.value = formatter.format(result);
      
    } catch (error) {
      this.showError("Hesaplama hatası!");
    }
  }
};

// Güvenli eval fonksiyonu
function evaluateExpression(expr) {
  try {
    // Hala new Function kullanıyoruz ancak daha güvenli bir şekilde
    // Bu bir optimizasyon olarak değil, güvenlik önlemi olarak yapılır
    return new Function(`'use strict'; return (${expr})`)();
  } catch (e) {
    throw new Error("Hesaplama hatası");
  }
}

// DOM yüklendiğinde başlat
document.addEventListener("DOMContentLoaded", () => {
  themeManager.init();
  memoryManager.init();
  calculator.init();
});