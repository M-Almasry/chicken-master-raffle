document.addEventListener('DOMContentLoaded', () => {

  // --- Translations ---
  const translations = {
    en: {
      nav_story: "Our Story",
      nav_menu: "Menu",
      nav_location: "Visit Us",
      hero_title: "Coming <span class='text-gold'>Soon</span>",
      hero_subtitle: "Chicken Master - Premium Wood-Fired Chicken",
      btn_menu: "Stay Tuned",
      section_story: "The Art of Grilling",
      story_p1: "At <strong>Chicken Master</strong>, we don't just cook; we craft. Our culinary philosophy is rooted in the primal elegance of fire and the sophistication of modern gastronomy.",
      story_p2: "Every cut is hand-selected, every marinade aged to perfection, and every flame controlled with mastery. Prepare for an atmosphere of \"Obsidian\" elegance and the gold standard of grilled chicken.",
      story_quote: "\"Where Premium Meets Passion\"",
      section_menu: "Opening Menu Sneak Peek",
      cat_chicken: "Premium Chicken",
      cat_salads: "Fresh Salads",

      // Chicken Items
      item_herb_title: "Herb-Grilled Chicken",
      item_herb_desc: "Marinated with rosemary, wild thyme, and olive oil.",
      item_peri_title: "Peri-Peri Chicken",
      item_peri_desc: "Famous spicy charcoal grilled chicken with lemon and garlic.",
      item_bbq_title: "BBQ Grilled Chicken",
      item_bbq_desc: "Glazed with smoky BBQ sauce while grilling.",
      item_shish_title: "Shish Taouk",
      item_shish_desc: "Marinated chicken breast cubes grilled on skewers.",
      item_boneless_title: "Boneless Grill",
      item_boneless_desc: "Whole boneless chicken, tender and grilled to perfection.",

      // Salad Items
      item_caesar_title: "Caesar Salad",
      item_caesar_desc: "Lettuce, croutons, parmesan, creamy caesar dressing.",
      item_greek_title: "Greek Salad",
      item_greek_desc: "Cucumber, tomato, onion, olives, feta cheese, oregano.",
      item_quinoa_title: "Quinoa Salad",
      item_quinoa_desc: "Quinoa, chopped veggies, parsley, nuts, lemon dressing.",
      item_arugula_title: "Arugula Salad",
      item_arugula_desc: "Fresh arugula, pomegranate, walnuts, onion, balsamic glaze.",

      section_location: "Find Us",
      open_hours: "Opening Soon!",
      address_text: "Tulkarm - Slaughterhouse Roundabout - Opposite B Laban",
      btn_directions: "Get Directions",
      footer_text: "&copy; 2026 Chicken Master. All Rights Reserved."
    },
    ar: {
      nav_story: "قصتنا",
      nav_menu: "القائمة",
      nav_location: "موقعنا",
      hero_title: "ترقبوا <span class='text-gold'>الافتتاح</span>",
      hero_subtitle: "تشيكن ماستر - قريباً دجاج مشوي فاخر ",
      btn_menu: "تابعونا",
      section_story: "فن الشواء",
      story_p1: "في <strong>تشيكن ماستر</strong>، نحن لا نطبخ فحسب، بل نبدع. فلسفتنا في الطهي متجذرة في أناقة النار البدائية ورقي فن الطهي الحديث.",
      story_p2: "يتم اختيار كل قطعة بعناية، وكل تتبيلة معتقة للكمال، ويتم التحكم في كل شعلة ببراعة. استعدوا لعالم من الأناقة وتذوق المعيار الذهبي للدجاج المشوي.",
      story_quote: "\"حيث يلتقي الشغف بالفخامة\"",
      section_menu: "لمحة عن القائمة",
      cat_chicken: "الدجاج الفاخر",
      cat_salads: "السلطات الطازجة",

      // Chicken Items
      item_herb_title: "دجاج بالأعشاب",
      item_herb_desc: "متبل بإكليل الجبل والزعتر البري وزيت الزيتون.",
      item_peri_title: "دجاج بيري بيري",
      item_peri_desc: "مشهور بلسعة حرارة ونكهة ليمون وثوم قوية.",
      item_bbq_title: "دجاج باربيكيو",
      item_bbq_desc: "مدهون بصوص الباربيكيو المدخن أثناء الشوي.",
      item_shish_title: "شيش طاووق",
      item_shish_desc: "قطع صدر دجاج مشوية على السيخ بتتبيلة الزبادي والبهارات.",
      item_boneless_title: "دجاج مسحب",
      item_boneless_desc: "دجاج كامل مخلي من العظم، طري جداً ومشوي على الفحم.",

      // Salad Items
      item_caesar_title: "سلطة سيزر",
      item_caesar_desc: "خس، خبز محمص، جبنة بارميزان، صوص سيزر كريمي.",
      item_greek_title: "سلطة يونانية",
      item_greek_desc: "خيار، طماطم، بصل، زيتون، جبنة فيتا، زيت زيتون، أوريغانو.",
      item_quinoa_title: "سلطة الكينوا",
      item_quinoa_desc: "كينوا، خضار مقطعة، بقدونس، مكسرات، صوص ليمون.",
      item_arugula_title: "سلطة الجرجير",
      item_arugula_desc: "جرجير، رمان، جوز، شرائح بصل، دبس رمان.",

      section_location: "تواصل معنا",
      open_hours: "الافتتاح قريباً!",
      address_text: "طولكرم - دوار المسلخ - مقابل ب لبن",
      btn_directions: "الموقع على الخريطة",
      footer_text: "&copy; 2026 تشيكن ماستر. جميع الحقوق محفوظة."
    }
  };

  // --- Language Logic ---
  let currentLang = 'ar'; // Default to Arabic

  function updateLanguage(lang) {
    currentLang = lang;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    // Update Text
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      if (translations[lang][key]) {
        // Check if it has HTML content
        if (element.innerHTML.includes('<') && translations[lang][key].includes('<')) {
          element.innerHTML = translations[lang][key];
        } else {
          element.innerHTML = translations[lang][key]; // Safe for our content
        }
      }
    });

    // Update Toggle Button Text
    const toggleBtn = document.getElementById('lang-toggle');
    if (toggleBtn) toggleBtn.textContent = lang === 'ar' ? 'English' : 'العربية';
  }

  // Toggle Button
  const langToggle = document.getElementById('lang-toggle');
  if (langToggle) {
    langToggle.addEventListener('click', (e) => {
      e.preventDefault();
      const newLang = currentLang === 'ar' ? 'en' : 'ar';
      updateLanguage(newLang);
    });
  }

  // Initialize Language
  updateLanguage(currentLang);


  // --- Existing Logic (Scroll, Animations) ---
  const navbar = document.querySelector('.navbar');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const hiddenElements = document.querySelectorAll('.hidden');
  hiddenElements.forEach((el) => observer.observe(el));

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });

});
