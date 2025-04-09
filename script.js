// DOM elementlerini tek seferde seçme
const elements = {
  modeToggle: document.getElementById("mode-toggle"),
  body: document.body,
  result: document.getElementById("result"),
  expression: document.getElementById("expression"),
  buttons: document.querySelector('.buttons'),
  keyboardGuideToggle: document.getElementById("keyboard-guide-toggle"),
  keyboardGuide: document.getElementById("keyboard-guide")
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
    
    // Negatif sayı kontrolü
    let isNegative = false;
    let numStr = num.toString();
    
    // Eğer sayı negatifse, negatif işaretini kaldır (format ederken)
    if (numStr.startsWith('-')) {
      isNegative = true;
      numStr = numStr.substring(1);
    }
    
    // Ondalık kısmını ve tam sayı kısmını ayır
    const parts = numStr.split('.');
    
    // Tam sayı kısmını formatla (bin ayırıcı ekle)
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    
    // Tekrar birleştir
    let result = parts.join(',');
    
    // Eğer sayı negatifse, parantez içinde göster
    if (isNegative) {
      result = "(-" + result + ")";
    }
    
    return result;
  },
  
  // Formatı kaldır
  unformat(str) {
    if (typeof str !== 'string') return str;
    
    // Parantezli negatif formattan normal negatif formata dönüştür
    if (str.startsWith('(-') && str.endsWith(')')) {
      str = '-' + str.substring(2, str.length - 1);
    }
    
    return str.replace(/\./g, '').replace(',', '.');
  }
};

// Klavye rehberi yönetimi
const keyboardGuideManager = {
  isVisible: false,
  
  init() {
    elements.keyboardGuideToggle.addEventListener('click', () => {
      this.toggle();
    });
    
    // Rehberi gizle/göster işlevi için olay dinleyicisi
    document.addEventListener('click', (e) => {
      // Eğer rehber görünür ve tıklanan element rehber veya toggle butonu değilse rehberi kapat
      if (this.isVisible && 
          e.target !== elements.keyboardGuide && 
          !elements.keyboardGuide.contains(e.target) &&
          e.target !== elements.keyboardGuideToggle) {
        this.hide();
      }
    });
  },
  
  show() {
    elements.keyboardGuide.classList.add('visible');
    this.isVisible = true;
    elements.keyboardGuideToggle.classList.add('active');
  },
  
  hide() {
    elements.keyboardGuide.classList.remove('visible');
    this.isVisible = false;
    elements.keyboardGuideToggle.classList.remove('active');
  },
  
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
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
        
      case '%':
        event.preventDefault();
        this.calculatePercentage();
        break;
        
      default:
        // Alt tuşu kombinasyonları
        if (event.altKey) {
          event.preventDefault();
          
          const keyCode = event.keyCode || event.which;
          
          if (keyCode === 67 || keyCode === 99) { // Alt + C (büyük/küçük c)
            this.clearResult();
          }
          else if (keyCode === 78 || keyCode === 110) { // Alt + N (büyük/küçük n)
            this.toggleNegative();
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
      case '%':
        this.calculatePercentage();
        break;
      case '+/-':
        this.toggleNegative();
        break;
      default:
        // Operatör mü?
        if (['+', '-', '*', '/'].includes(action)) {
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
    
    // Eğer değer boşsa ve "-" operatörü girildiyse negatif sayı olarak kabul et
    if (elements.result.value === "" && op === "-") {
      elements.result.value = "-";
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
    
    if (elements.result.value === "") {
      elements.result.value = "0.";
    } else {
      const lastChar = unformatted.slice(-1);
      if (['+', '-', '*', '/'].includes(lastChar)) {
        elements.result.value += "0.";
      } else {
        elements.result.value = formatter.format(unformatted + (lastPart === "" ? "0." : "."));
      }
    }
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
  },
  
  // YENİ: Yüzde hesaplama fonksiyonu
  calculatePercentage() {
    if (!elements.result.value) return;
    
    try {
      // İfadeyi analiz et
      const unformatted = formatter.unformat(elements.result.value);
      
      // İfadeyi matematiksel sembollerle parçalara ayır
      const parts = unformatted.split(/([+\-*/])/);
      
      // Eğer tek sayı varsa basitçe /100 yapalım
      if (parts.length === 1) {
        const value = parseFloat(parts[0]);
        elements.result.value = formatter.format(value / 100);
        return;
      }
      
      // Son sayıyı ve operatörü al
      const lastNumber = parts[parts.length - 1];
      const operator = parts[parts.length - 2];
      const previousNumber = parts[parts.length - 3];
      
      // Eğer son işlemde sayı yoksa hata göster
      if (lastNumber === "" || isNaN(lastNumber)) {
        this.showError("Geçersiz yüzde işlemi!");
        return;
      }
      
      let result;
      switch (operator) {
        case '+':
        case '-':
          // Toplama/çıkarma için: sayı1 +/- (sayı1 * sayı2 / 100)
          result = parseFloat(previousNumber) + (parseFloat(previousNumber) * parseFloat(lastNumber) / 100 * (operator === '+' ? 1 : -1));
          break;
        case '*':
          // Çarpma için: sayı1 * (sayı2 / 100)
          result = parseFloat(previousNumber) * (parseFloat(lastNumber) / 100);
          break;
        case '/':
          // Bölme için: sayı1 / (sayı2 / 100)
          result = parseFloat(previousNumber) / (parseFloat(lastNumber) / 100);
          break;
        default:
          // Eğer operatör yoksa, sadece sayıyı 100'e böl
          result = parseFloat(lastNumber) / 100;
      }
      
      // Sonucu göster
      elements.result.value = formatter.format(result);
      
    } catch (error) {
      this.showError("Yüzde hesaplama hatası!");
    }
  },
  
  // DÜZELTILMIŞ: Negatif/Pozitif değiştirme fonksiyonu
  toggleNegative() {
    if (!elements.result.value) return;
    
    try {
      // Değeri al
      let currentValue = elements.result.value;
      let unformatted = formatter.unformat(currentValue);
      
      // Negatif değilse negatif yap, negatifse pozitif yap
      if (currentValue.startsWith('(-') && currentValue.endsWith(')')) {
        // Parantez içindeki negatif sayıyı pozitif yap
        unformatted = unformatted.substring(1); // Başındaki - işaretini kaldır
        elements.result.value = formatter.format(parseFloat(unformatted));
      } else {
        // Operatör içeren ifade mi kontrol et
        const operators = ['+', '-', '*', '/'];
        let lastOperatorPos = -1;
        
        for (const op of operators) {
          const pos = unformatted.lastIndexOf(op, unformatted.length - 2); // Son sayıda olabilecek - işaretini atla
          if (pos > lastOperatorPos) {
            lastOperatorPos = pos;
          }
        }
        
        if (lastOperatorPos === -1) {
          // Tek sayı var, negatif yap
          const num = parseFloat(unformatted);
          elements.result.value = formatter.format(-num);
        } else {
          // İşlem var, son sayıyı bul ve negatif/pozitif yap
          const beforePart = unformatted.substring(0, lastOperatorPos + 1);
          let lastPart = unformatted.substring(lastOperatorPos + 1);
          
          if (lastPart.startsWith('-')) {
            // Zaten negatifse pozitif yap
            lastPart = lastPart.substring(1);
          } else {
            // Pozitifse negatif yap
            lastPart = '-' + lastPart;
          }
          
          // Birleştir ve formatla
          const newValue = beforePart + lastPart;
          elements.result.value = newValue; // Burada direkt birleştirip koyuyoruz, format sonrası görülecek
          
          // Hesap makinesindeki gösterimi güncellemek için sayı tuşu gibi davranarak format uygulayalım
          this.appendNumber('');
        }
      }
    } catch (error) {
      this.showError("İşlem hatası!");
    }
  }
};

// Güvenli eval fonksiyonu
function evaluateExpression(expr) {
  try {
    // Hala new Function kullanıyoruz ancak daha güvenli bir şekilde
    return new Function(`'use strict'; return (${expr})`)();
  } catch (e) {
    throw new Error("Hesaplama hatası");
  }
}

// DOM yüklendiğinde başlat
document.addEventListener("DOMContentLoaded", () => {
  themeManager.init();
  keyboardGuideManager.init();
  calculator.init();
});