// story.js - محرك القصص التفاعلية الذكي

const FALLBACK_STORIES = [
  {
    title: "رحلة {name} إلى القمر",
    emoji: "🚀",
    chapters: [
      {
        title: "بداية الرحلة",
        text: "في ليلة هادية وجميلة مليانة بنجوم بتلمع في السما، {name} {g:كان قاعد|كانت قاعدة} في جنينة البيت مع {friend}. كانوا بيبصوا للقمر المنور وبيشربوا عصير دافي وبيتكلموا عن أسرار الفضاء الواسع. وفجأة، ظهر نور فضي ساحر نازل من السما ببطء، وشافوا صاروخ صغير ملون وجميل جداً بيهبط بهدوء فوق العشب الأخضر ويستقر قدامهم مباشرة، وكان بيطلع أنوار ملونة ومزيكا هادية خطفت قلوبهم!",
        emoji: "🌳"
      },
      {
        title: "التحدي الفضائي",
        text: "{name} {g:اتشجع وقال|اتشجعت وقالت} لـ {friend}: «تعال نخوض أجمل مغامرة!» وفتحوا باب الصاروخ الصغير وركبوا جواه بحماس. أول ما قفلوا الباب، الصاروخ انطلق بسرعة ونعومة في اتجاه السحاب، وطار بيهم فوق البيوت والأنوار وسط النجوم المتلألئة وكواكب ملونة شبه الكريستال. فجأة، وقفت شاشة الصاروخ الذكية وظهر عليها كائن فضائي لطيف قال بصوت مرح: «أهلاً {g:يا بطل|يا بطلة}! عشان شحن الصاروخ يكمل ونوصل لسطح القمر، لازم {g:تشغل ذكاءك وتحل|تشغلي ذكاءك وتحلي} التحدي ده!»\n\n[QUESTION_HERE]",
        emoji: "❓"
      },
      {
        title: "بعد الإجابة",
        text: "بعد ما {name} {g:فكر بتركيز وجاوب|فكرت بتركيز وجاوبت} الإجابة الصح، شاشة الصاروخ نورت بنور أخضر براق وعملت صوت موسيقى فايزة (بيييب بيييب هوراااي!). اشتغلت المحركات بقوة ناعمة ووصل الصاروخ لسطح القمر السحري اللي كان بيلمع تحت رجليهم زي بودرة الفضة النقية. {name} {g:نزل ولعب|نزلت ولعبت} مع {friend} في جاذبية القمر الخفيفة، وكانوا بيقفزوا عالي لفوق زي الفراشات وهما بيضحكوا ومبسوطين جداً من روعة المشهد.",
        emoji: "🌙"
      },
      {
        title: "العودة للبيت",
        text: "حان وقت الرجوع، فالصاروخ رجع بيهم برقة لحد جنينة البيت من غير ما حد يحس. {g:دخل|دخلت} {name} البيت {g:ولقى|ولقيت} {mother} و{father} {g:مستنيينه|مستنيينها} بابتسامة دافية وبطانية ناعمة، {g:حكى|حكت} لهم كل تفاصيل الرحلة المذهلة. {g:حضنته|حضنتها} {mother} بحنان وقالت: «{g:أنت بطل حقيقي وذكي جداً|أنتِ بطلة حقيقية وذكية جداً} يا {name}، وبكرة عندك مغامرات أحلى وأجمل في أحلامك الهادية». {g:غمض عينيه براحة ونام نوم عميق وسعيد|غمضت عينيها براحة ونامت نوم عميق وسعيد}.. وتوتة توتة خلصت الحدوتة.",
        emoji: "💫"
      }
    ]
  },
  {
    title: "مغامرة {name} في الغابة السحرية",
    emoji: "🦁",
    chapters: [
      {
        title: "اكتشاف الباب السحري",
        text: "في عصر يوم مشمس ولطيف، {name} {g:كان بيلعب|كانت بتلعب} في حديقة البيت مع إخوته {siblings} لعبة الاستغماية. وهما بيدوروا ورا الشجر الكبير، لاحظوا شجيرة ورد عجيبة أوراقها بتلمع بلون دهبي وبتطلع روايح جميلة زي الفل والياسمين. لما زاحوا الفروع بهدوء، لقوا باب خشب قديم منقوش عليه نجوم وقوس قزح! {name} {g:مد إيده بفضول وفتح|مدت إيدها بفضول وفتحت} الباب، فلقوا نفسهم جوة غابة سحرية شجرها عملاق وبيغني مع الهوا ونباتاتها بتنور بألوان خيالية!",
        emoji: "🚪"
      },
      {
        title: "لغز البومة الحكيمة",
        text: "مشيت المجموعة بخطوات هادية ومبهورة بجمال الغابة، وفجأة وصلوا لجسر خشبي معلق فوق نهر ميته صافية بتلمع زي الألماس. على أول الجسر، كانت قاعدة بومة حكيمة بيضا ولابسة نضارة صغيرة وشايلة كتاب كبير. رفعت البومة راسها وقالت بابتسامة وقورة: «يا هلا {g:بالبطل الذكي|بالبطلة الذكية} {name}! الجسر ده مسحور ومحدش يقدر يعدي للضفة التانية ويوصل لشجرة الأمنيات إلا لما {g:يحل|تحل} لغز الذكاء ده الأول»:\n\n[QUESTION_HERE]",
        emoji: "❓"
      },
      {
        title: "بعد الإجابة",
        text: "ابتسمت البومة بإعجاب شديد لما {name} {g:قال|قالت} الإجابة الصح من أول مرة، ورفرفت بجناحيها وفتحت الجسر فأنارت درجاته كلها بنور دهبي دافئ. {g:عدى|عدت} {name} مع {siblings} الجسر وهما بيسقفوا وفرحانين، وفجأة طارت حواليهم أسراب من الفراشات المضيئة الملونة بالأزرق والبنفسجي، وكانت بترقص وتعمل أشكال مبهجة وتغني لهم لحن النجاح والشجاعة في جو كله بهجة وسلام.",
        emoji: "🦋"
      },
      {
        title: "رجوع الأبطال",
        text: "بعد ساعات من اللعب والاستكشاف في الغابة السحرية، فتحوا بوابة الرجوع ولقوا نفسهم في أوضتهم الدافية وسط ألعابهم. كان {father} مجهز لهم وجبة عشا لذيذة وصحية ومشروب دافي ومغذي. قعد {father} يسمع حكاياتهم الشيقة بكل فخر واهتمام وقال: «{g:شاطر يا بطلنا|شاطرة يا بطلتنا}، الذكاء والتعاون هما سر كل نجاح». {g:دخل|دخلت} {name} {g:سريره المريح، وتغطى|سريرها المريح، وتغطت} باللحاف الناعم {g:ونام في طمأنينة وسكون|ونامت في طمأنينة وسكون}.",
        emoji: "💤"
      }
    ]
  },
  {
    title: "{name} والكنز المفقود",
    emoji: "🏴‍☠️",
    chapters: [
      {
        title: "خريطة قديمة",
        text: "{name} {g:كان قاعد|كانت قاعدة} في يوم إجازة هادي {g:بيقلب|بتقلب} في الكتب والمجلات القديمة في مكتبة البيت، وفجأة وقعت من بين الصفحات ورقة صفراء سميكة ملفوفة بشريط حرير أزرق. {g:فتحها بفضول مع صاحبه|فتحتها بفضول مع صاحبتها} {friend}، واكتشفوا إنها خريطة كنز حقيقية مرسوم عليها جزر وبحار وعلامة إكس حمراء كبيرة بتشير لمكان سري في جزيرة الأسرار! عيونهم لمعت بالحماس وقرروا ينطلقوا فوراً في رحلة شيقة للبحث عن الكنز العجيب.",
        emoji: "🗺️"
      },
      {
        title: "صندوق الكنز",
        text: "اتبعوا خطوات الخريطة بدقة عالية؛ مشوا جنب الشاطئ الرملي الدهبي وعدوا بين النخيل العالي لحد ما وصلوا لمغارة سرية بتنور بكريستالات لامعة. في نص المغارة، لقوا صندوق خشب متين ومزين بزخارف قديمة وقفل إلكتروني حديث بيلمع. لما {g:قرب|قربت} {name} من الصندوق، نطقت شاشة القفل بصوت نقي وقالت: «أهلاً {g:بالمستكشف الصغير|بالمستكشفة الصغيرة}! عشان أفتح الأقفال وتشوف المفاجأة اللي جوة، لازم تثبت سرعة بديهتك وتجاوب السؤال ده»:\n\n[QUESTION_HERE]",
        emoji: "❓"
      },
      {
        title: "بعد الإجابة",
        text: "بكل ثقة وذكاء، {g:ضغط|ضغطت} {name} على زرار الإجابة الصح، وفي ثانية واحدة نور القفل باللون الأخضر وانفتحت الأقفال بتكة موسيقية مفرحة! طلع من الصندوق نور مبهر، ولما بصوا جواه لقوا أروع كنز ممكن يتخيلوه: كتب حكايات ملونة ومجسمات ألعاب ذكاء وألوان رسم رائعة وميداليات دهبية مكتوب عليها «وسام الذكاء والشجاعة». {g:قفز|قفزت} {name} مع {friend} من شدة الفرحة بالفوز الكبير.",
        emoji: "🎁"
      },
      {
        title: "أحلى كنز",
        text: "{g:رجع|رجعت} {name} البيت {g:وهو شايل الصندوق بفرح وفخر، وقرر يشارك|وهي شايلا الصندوق بفرح وفخر، وقررت تشارك} الكنز مع كل عيلته وحبايبه، {g:فوزع|فوزعت} الهدايا والقصص الجميلة على {siblings}، {g:وقدم|وقدمت} وردة جميلة وهدية مميزة لـ {mother} و{father}. ابتسمت العيلة كلها {g:وحضنوه|وحضنوها} بحب كبير، {g:وحس|وحست} {name} في {g:قلبه|قلبها} بدفء وسعادة حقيقية، {g:وعرف|وعرفت} إن أحلى وأغلى كنز في الدنيا كلها هو لَمّة العيلة والحب اللي بيجمعهم. {g:نام وهو مبتسم ومبسوط|نامت وهي مبتسمة ومبسوطة}.",
        emoji: "❤️"
      }
    ]
  },
  {
    title: "{name} {g:وبطل|وبطلة} الرياضة",
    emoji: "⚽",
    chapters: [
      {
        title: "يوم الماتش",
        text: "النهاردة كان يوم استثنائي ومتحمس جداً في النادي الرياضي الكبير، والشمس منورة والجو جميل ومثالي للعب. {name} {g:كان لابس الطقم الرياضي المميز وكوتشي الجري السريع، ومستعد|كانت لابسة الطقم الرياضي المميز وكوتشي الجري السريع، ومستعدة} تماماً لماتش البطولة الحاسم بعد أسابيع طويلة من التمرين والاجتهاد. في المدرجات، كان {father} و{mother} قاعدين ورافعين يافطة تشجيع كبيرة ومتحمسين وبيشجعوا بكل فخر وحب، وهتافات الجماهير كانت بتملا الملعب طاقة وحيوية.",
        emoji: "🏟️"
      },
      {
        title: "ضربة الجزاء",
        text: "الماتش كان حماسي وقوي جداً بين الفريقين، والنتيجة كانت تعادل في الدقيقة الأخيرة من عمر اللقاء. فجأة، {g:عمل|عملت} {name} مراوغة سريعة وذكية، فصفر الحكم وأعلن عن ضربة جزاء حاسمة لصالح الفريق! مسك المدرب الكرة وابتسم وقال: «يا {name}، {g:البطل الحقيقي بيجمع|البطلة الحقيقية بتجمع} بين قوة الجسم وذكاء العقل؛ {g:خد نفس عميق وركز|خدي نفس عميق وركزي} عشان {g:تحل اللغز ده قبل ما تشوط|تحلي اللغز ده قبل ما تشوطي} الكورة في المرمى»:\n\n[QUESTION_HERE]",
        emoji: "❓"
      },
      {
        title: "بعد الإجابة",
        text: "بتركيز عالي وهدوء وثقة، {g:جاوب|جاوبت} {name} المسألة صح في ثواني معدودة {g:ونال إعجاب|ونالت إعجاب} الحكم والمدرب. {g:تقدم|تقدمت} {name} للكرة {g:وثبتها على النقطة البيضاء، وجرى خطوتين وسددها|وثبتتها على النقطة البيضاء، وجريت خطوتين وسددتها} بقوة ودقة لا تصد ولا ترد في زاوية المقص.. وجووووووول تاريخي هز الشباك! اشتعل الملعب بالهتاف والتصفيق الحار، وجري كل الفريق وحملوا {name} على الأعناق ورفعوا كأس البطولة عالي وسط فرحة ما تتوصفش.",
        emoji: "🏆"
      },
      {
        title: "الاحتفال والراحة",
        text: "بعد الماتش الرائع، احتفل الجميع بالفوز الكبير واشترى {father} آيس كريم مثلج ولذيذ لـ {name} ولكل الصحاب اللي شاركوا في البطولة. قال {father} وهو فخور: «العقل السليم في الجسم السليم، {g:وأنت أثبت إن الشطارة والتركيز هما طريق القمة يا بطل|وأنتِ أثبتّي إن الشطارة والتركيز هما طريق القمة يا بطلة}». {g:رجع|رجعت} {name} البيت، {g:أخد شاور دافي مريح ورتب ميداليته الدهبية جنب سريره، ونام وهو بيحلم|أخدت شاور دافي مريح ورتبت ميداليتها الدهبية جنب سريرها، ونامت وهي بتحلم} بانتصارات وبطولات جديدة أحلى وأحلى.",
        emoji: "🍦"
      }
    ]
  },
  {
    title: "مزرعة الحيوانات السعيدة",
    emoji: "🐄",
    chapters: [
      {
        title: "رحلة المزرعة",
        text: "مع إشراقة شمس يوم الجمعة الجميلة، {g:صحى|صحيت} {name} بنشاط {g:وراح|وراحت} في رحلة شيقة مع {father} لمزرعة خضراء واسعة في الريف الهادي. كانت ريحة الهوا النقي والأشجار المثمرة تفتح النفس، وأصوات العصافير بتزقزق بأجمل ألحان الصباح. {g:شاف|شافت} {name} الأبقار البيضا والسمرا بتاكل عشب طازة، والخراف الصغيرة الصوفية بتجري وتلعب في المروج، ومجموعة من الخيول الأصيلة بتركض بخفة ورشاقة في المضمار.",
        emoji: "🚜"
      },
      {
        title: "مساعدة المزارع",
        text: "استقبلهم عم المزارع الطيب بقبعته المصنوعة من القش وابتسامته البشوشة، ورحب بيهم وقدم لهم كوبايات حليب دافية وطازجة. طلب المزارع من {name} {g:يساعده|تساعده} في تنظيم سلال الفواكه وإحصاء المحصول الجديد في المخزن الكبير، وقاله بلطف: «يا {g:بطلنا الصغير|بطلتنا الصغيرة}، عشان نتأكد من حسابات الصناديق بدقة، محتاج مساعدتك وشطارتك في حل المسألة الرياضية البسيطة دي»:\n\n[QUESTION_HERE]",
        emoji: "❓"
      },
      {
        title: "بعد الإجابة",
        text: "ما {g:خدش|خدتش} {name} غير لحظات قليلة، {g:وحسبها في سره وجاوب|وحسبتها في سرها وجاوبت} بكل شطارة وسرعة متناهية! انبهر عم المزارع بذكائها الواسع وسقف {g:له|لها} بحرارة، ومكافأة على {g:شطارته أخدها في جولة استثنائية وركبه|شطارتها أخدها في جولة استثنائية وركبها} على حصان صغير أبيض وجميل ولف {g:بيه|بيها} حوالين بساتين البرتقال والرمان، وكانت {name} {g:بتضحك ومبسوط ومنطلق|بتضحك ومبسوطة ومنطلقة} وسط الخضرة والجمال الريفي الساحر.",
        emoji: "🐴"
      },
      {
        title: "نهاية اليوم الهادي",
        text: "مع غروب الشمس الدهبي، جهز عم المزارع سلة خوص مليانة تفاح أحمر وخوخ طازة عشان يهدوها لـ {mother} في البيت تعبيراً عن شكرهم وامتنانهم. {g:ودع|ودعت} {name} الحيوانات اللطيفة {g:ورجع|ورجعت} في العربية مع {father} ونسيم الليل العليل بيهفهف حواليهم. أول ما {g:وصل|وصلت} البيت، {g:حضن مامته وأكل|حضنت مامتها وأكلت} تفاحة لذيذة، {g:وراح لسريره الدافي يحط راسه على المخدة وينام وهو بيفتكر|وراحت لسريرها الدافي تحط راسها على المخدة وتنام وهي بتفتكر} عيون الحصان الأبيض الطيب.",
        emoji: "🍎"
      }
    ]
  },
  {
    title: "الغواصة العجيبة",
    emoji: "🚤",
    chapters: [
      {
        title: "النزول للأعماق",
        text: "{name} {g:المبتكر الصغير كان بيعشق|المبتكرة الصغيرة كانت بتعشق} علوم البحر والاكتشافات، عشان كده {g:صمم وصنع|صممت وصنعت} غواصة استكشافية صفراء صغيرة ومزودة بكشافات إضاءة قوية. {g:نزل|نزلت} {name} في أعماق البحر الأزرق الهادي برفقة {friend}، وبدأت الغواصة تغوص بنعومة وسلاسة في المية الصافية. كانوا مبهورين بالأسماك الملونة الصغيرة اللي بتسبح في مجموعات، ونجم البحر الوردي اللي نايم على الصخور والشعب المرجانية اللي بتلمع بألوان قوس قزح في كل مكان.",
        emoji: "🐠"
      },
      {
        title: "سمكة القرش الطيبة",
        text: "وفجأة ومن وراء صخرة بحرية ضخمة، ظهرت سمكة قرش عملاقة بأنياب بيضاء، فخافوا في البداية لكن اتفاجأوا إن القرش لابس كاب قبطان بحري وابتسم ابتسامة ودودة جداً! حرك القرش زعانفه وقال عبر جهاز اللاسلكي بصوت عميق ومرح: «أهلاً برواد الأعماق! أنا حارس ممر المرجان السري، وممنوع حد يعدي لمنطقة اللؤلؤ المشع إلا أصحاب العقول الذكية والنبيهة.. وروني شطارتكم في حل السؤال ده»:\n\n[QUESTION_HERE]",
        emoji: "❓"
      },
      {
        title: "بعد الإجابة",
        text: "بشجاعة وبدون أي تردد، {g:قدم|قدمت} {name} الحل السليم بكل وضوح ودقة، فضحك القرش الطيب ضحكة هزت فقاعات المية وقدم لهم تحية عسكرية بحرية بكل احترام! وسع القرش الطريق للغواصة وأهداهم صدفة بحرية بتنور في الأعماق. تابعت الغواصة طريقها ووصلت لمدينة المرجان الخرافية، وشافوا السلاحف البحرية المعمرة والدلافين اللطيفة وهي بتقفز وتدور بحركات بهلوانية حوالين الغواصة في مشهد ساحر يفرح القلب.",
        emoji: "🪸"
      },
      {
        title: "حكايات البحر",
        text: "صعدت الغواصة بسلام للشاطئ مع حلول المساء وهدوء حركة الأمواج على الرمل الناعم. {g:رجع|رجعت} {name} البيت والابتسامة على {g:وشه|وشها}، {g:وقعد|وقعدت} مع إخوته {siblings} {g:ووراهم|وورتهم} الصدفة المضيئة {g:وحكى|وحكت} لهم كل الأسرار والمغامرات الشيقة اللي {g:شافها|شافتها} تحت سطح البحر. {g:شرب|شربت} {name} كوباية يانسون دافية {g:ولبس بيجامته المريحة، ونام في سريره وهو حاسس كأنه بيتأرجح|ولبست بيجامتها المريحة، ونامت في سريرها وهي حاسة كأنها بتتأرجح} بنعومة وهدوء فوق أمواج البحر الهادية الحالمة.",
        emoji: "🌊"
      }
    ]
  },
  {
    title: "قطار المفاجآت",
    emoji: "🚂",
    chapters: [
      {
        title: "تذكرة السفر الذهبية",
        text: "في صباح يوم مميز، {g:لقى|لقت} {name} في صندوق البريد ظرفاً أنيقاً لامعاً جواه تذكرة سفر ذهبية براقة منقوش عليها عبارة: «تذكرة خاصة لركوب قطار المفاجآت السريع». {g:توجه|توجهت} {name} لمحطة القطار العجيبة {g:ولقى|ولقت} قطاراً فضياً فاخراً بيطلق دخاناً من فقاعات الصابون الملونة! {g:ركب القطر ودخل مقصورة رائعة كراسيها مصنوعة من قطن ناعم كالسحاب، وكانت فيه شاشات بتعرض مناظر طبيعية خلابة ومزيكا هادية جداً بتملأ المكان بالسكينة والبهجة.|ركبت القطر ودخلت مقصورة رائعة كراسيها مصنوعة من قطن ناعم كالسحاب، وكانت فيه شاشات بتعرض مناظر طبيعية خلابة ومزيكا هادية جداً بتملأ المكان بالسكينة والبهجة.}",
        emoji: "🎫"
      },
      {
        title: "مفتش التذاكر الأرنب",
        text: "بينما كان القطار ينطلق بسرعة فائقة وبسلاسة فوق قضبان من الضوء، فتح الباب مفتش تذاكر غير عادي؛ كان أرنباً أبيض لطيفاً يرتدي سترة رسمية وطاقية زرقاء ويحمل ختامة سحرية. نظر الأرنب للتذكرة بابتسامة واسعة وقال: «يا مرحباً {g:بالمسافر البطل|بالمسافرة البطلة} {name}! محطتنا الجاية هي محطة الألعاب الكبرى، وعشان التذكرة دي تتفعل وتفتح لك باب عربة المفاجآت والهدايا، لازم تجاوب على فزورة الذكاء دي بنجاح»:\n\n[QUESTION_HERE]",
        emoji: "❓"
      },
      {
        title: "بعد الإجابة",
        text: "{g:فكر|فكرت} {name} بهدوء وبراعة {g:وقال|وقالت} الحل الصحيح بمنتهى الثقة، فقام الأرنب بختم التذكرة الذهبية التي توهجت بنجوم صغيرة متطايرة ومبهجة! وفجأة انفتح الباب المجاور ليكتشفوا عربة ملاهي مذهلة داخل القطار، فيها زحاليق ناعمة من الإسفنج الملون ومسرح للأراجوز ومسبح كرات بلاستيكية ملونة، {g:وقضى|وقضت} {name} وقتاً أسطورياً مليئاً بالضحك والمرح غير المسبوق بصحبة الركاب اللطفاء.",
        emoji: "🎢"
      },
      {
        title: "محطة الوصول السعيدة",
        text: "أطلق القطار صفارته الموسيقية الهادئة معلناً الوصول للمحطة النهائية في موعده المضبوط. وعلى رصيف المحطة، كان {father} و{mother} في انتظار {name} بأذرع مفتوحة وشوق كبير بعد هذه التجربة الممتعة. {g:حكى|حكت} لهم عن قطار الأحلام والأرنب اللطيف {g:وهو ماسك|وهي ماسكة} بالون مضيء تذكاراً من الرحلة، وعادوا جميعاً للمنزل الدافئ حيث {g:استلقى|استلقت} {name} في {g:فراشه ونام نوماً هنيئاً وهو يردد في سره|فراشها ونامت نوماً هنيئاً وهي تردد في سرها} تفاصيل أجمل رحلة قطار.",
        emoji: "🎉"
      }
    ]
  },
  {
    title: "حديقة الديناصورات",
    emoji: "🦕",
    chapters: [
      {
        title: "آلة الزمن",
        text: "{name} {g:كان شغوفاً ومحباً|كانت شغوفة ومحبة} للاختراعات والعلوم الطبيعية، وفي {g:ورشته الصغيرة في أوضته انتهى|ورشتها الصغيرة في أوضتها انتهت} من تجميع جهاز عجيب يشبه الساعة المضيئة وهو «آلة الزمن المصغرة». {g:ضغط|ضغطت} {name} على الزر الأخضر، فبدأت الأضواء تدور بحركة دائرية سريعة وهبت نسمة هواء دافية، وفي لحظة واحدة {g:لقى نفسه بينتقل|لقيت نفسها بتنتقل} عبر ملايين السنين {g:ليقف وسط غابة استوائية عملاقة أشجارها ضخمة ونباتاتها خضراء يانعة، وشاهد|لتقف وسط غابة استوائية عملاقة أشجارها ضخمة ونباتاتها خضراء يانعة، وشاهدت} في الأفق ديناصورات طيبة مسالمة تأكل من أوراق الشجر العالية.",
        emoji: "⏳"
      },
      {
        title: "لغز الديناصور الصغير",
        text: "بينما {g:كان يتأمل المشهد بذهول وإعجاب، سمع|كانت بتتأمل المشهد بذهول وإعجاب، سمعت} صوت بكاء خافت قادم من وراء صخرة كبيرة، {g:فاقترب|فاقتربت} بحذر لتجد ديناصوراً صغيراً لطيفاً ذو عيون واسعة وبريئة قد تاه عن أسرته ولا يعرف طريق العودة. {g:هدأ|هدت} {name} من روع الديناصور {g:ومسح دموعه وقرر مساعدته|ومسحت دموعه وقررت مساعدته}، لكن المسار عبر الغابة كان مغلقاً ببوابة صخرية طبيعية منقوش عليها لغز قديم: «إذا أردت أن تفتح الطريق للصغير، فاختر الإجابة الصحيحة لهذا السؤال»:\n\n[QUESTION_HERE]",
        emoji: "❓"
      },
      {
        title: "بعد الإجابة",
        text: "بفضل سرعة بديهة {name} {g:وتركيزه العالي، استطاع حل|وتركيزها العالي، استطاعت حل} اللغز الصخري بدقة، فانفتحت الصخور الصامتة لتكشف عن ممر ممهد مليء بزهور النرجس العطرة. {g:قاد|قادت} {name} الديناصور الصغير بأمان واطمئنان حتى وصل إلى وادي الديناصورات الفسيح، وهناك هرعت أمه الضخمة الطيبة واحتضنت صغيرها بفرح غامر، وانحنت لـ {name} وأطلقت صوتاً رقيقاً تعبيراً عن شكرها وامتنانها {g:لشهامته وذكائه الاستثنائي|لشهامتها وذكائها الاستثنائي}.",
        emoji: "🦖"
      },
      {
        title: "الرجوع للحاضر والهدوء",
        text: "{g:ودع|ودعت} {name} أصدقاءه الجدد {g:ولوح|ولوحت} لهم {g:بيده|بإيدها} بمحبة، ثم {g:ضغط|ضغطت} على زر العودة في آلة الزمن {g:ليرجع إلى أوضته الآمنة|لترجع إلى أوضتها الآمنة} في نفس اللحظة. {g:بص|بصت} {name} إلى ساعتها {g:وشعر|وشعرت} بالراحة والرضا بعد هذا العمل الطيب والإنجاز الرائع، {g:راح للحمام وغسل أسنانه بالفرشاة والمعجون ولبس بيجامته المريحة، ثم ارتمى في سريره الوثير وغمض عينيه مبتسم ومستعد|راحت للحمام وغسلت أسنانها بالفرشاة والمعجون ولبست بيجامتها المريحة، ثم ارتمت في سريرها الوثير وغمضت عينيها مبتسمة ومستعدة} لأحلام وردية هادئة بعد مغامرة تاريخية لا تُنسى.",
        emoji: "🪥"
      }
    ]
  }
];

class StoryEngine {
  constructor() {
    this.childData = this.loadChildData();
    this.apiKey = (localStorage.getItem('gemini_api_key') || '').trim().replace(/^["']|["']$/g, '');
    this.currentStory = null;
    this.currentChapter = 0;
    this.question = null;
    
    // UI Elements
    this.views = {
      loading: document.getElementById('loading-view'),
      story: document.getElementById('story-view'),
      finish: document.getElementById('finish-view')
    };
    
    this.btnNext = document.getElementById('btn-next');
    this.btnPrev = document.getElementById('btn-prev');
    this.btnRead = document.getElementById('btn-read');
    this.qArea = document.getElementById('question-area');
    
    // Bind Events
    this.btnNext.onclick = () => this.nextChapter();
    this.btnPrev.onclick = () => this.prevChapter();
    this.btnRead.onclick = () => this.readCurrentChapter();
    
    // Start
    this.init();
  }

  loadChildData() {
    const isGirl = localStorage.getItem('kids_gender') === 'girl';
    return {
      name: localStorage.getItem('piggyName') || localStorage.getItem('mp_playerName') || (isGirl ? 'بطلة المستقبل' : 'بطل المستقبل'),
      gender: isGirl ? 'girl' : 'boy',
      age: localStorage.getItem('kids_age') || '8',
      school: localStorage.getItem('kids_school') || 'المدرسة',
      father: localStorage.getItem('kids_father') || 'بابا',
      mother: localStorage.getItem('kids_mother') || 'ماما',
      siblings: localStorage.getItem('kids_siblings') || 'إخواتي',
      friend: (localStorage.getItem('kids_friends') || '').split('،')[0] || (isGirl ? 'صاحبتي' : 'صاحبي'),
      grade: localStorage.getItem('kids_class') || 'kids_2'
    };
  }

  setupHeroAvatar() {
    const isGirl = this.childData.gender === 'girl';
    const heroImg = document.getElementById('loading-hero-img');
    const heroName = document.getElementById('loading-hero-name');
    const heroBadge = document.getElementById('hero-badge-icon');

    const name = this.childData.name || (isGirl ? 'بطلة المستقبل' : 'بطل المستقبل');
    if (heroName) {
      const prefix = isGirl ? 'البطلة ' : 'البطل ';
      heroName.textContent = name.startsWith('بطل') ? name : (prefix + name);
    }
    if (heroBadge) {
      heroBadge.textContent = isGirl ? '🌸' : '⭐';
    }

    let card = null;
    try { card = JSON.parse(localStorage.getItem('gbCard') || 'null'); } catch(e) {}
    const defaultPhoto = isGirl ? 'assets/sprites/heroine-stand.png' : 'assets/patman.png';
    const photo = (card && (card.photo || card.avatar)) || localStorage.getItem('mp_avatar') || defaultPhoto;

    if (heroImg) {
      heroImg.src = photo;
      heroImg.onerror = () => {
        heroImg.src = defaultPhoto;
      };
    }
  }

  async init() {
    const isGirl = this.childData.gender === 'girl';
    
    // Setup Hero Avatar & Name
    this.setupHeroAvatar();

    // Adapt UI labels based on gender
    const loadText = document.querySelector('.loading-text');
    if (loadText) {
      loadText.textContent = isGirl 
        ? 'بنكتب لك قصة مخصوصة يا بطلة... 🌸' 
        : 'بنكتب لك قصة مخصوصة يا بطل... 🌟';
    }
    const finishH2 = document.querySelector('#finish-view h2');
    if (finishH2) {
      finishH2.textContent = isGirl
        ? 'تصبحين على خير يا بطلة! 🌸'
        : 'تصبح على خير يا بطل! 🌟';
    }

    // 3D Progress Loader
    let pct = 0;
    const fillEl = document.getElementById('loading-progress-fill');
    const badgeEl = document.getElementById('loading-pct-badge');
    const glowEl = document.getElementById('progress-3d-glow');
    const phaseEl = document.getElementById('prog-phase-label');

    const updateProgress = (val) => {
      pct = val;
      if (fillEl) fillEl.style.width = val + '%';
      if (badgeEl) badgeEl.textContent = val + '%';
      if (glowEl && badgeEl) {
        if (val < 35) {
          badgeEl.style.color = '#fca5a5';
          badgeEl.style.borderColor = 'rgba(239, 68, 68, 0.5)';
          glowEl.style.boxShadow = '0 0 16px rgba(239, 68, 68, 0.7)';
        } else if (val < 70) {
          badgeEl.style.color = '#fde047';
          badgeEl.style.borderColor = 'rgba(245, 158, 11, 0.6)';
          glowEl.style.boxShadow = '0 0 16px rgba(245, 158, 11, 0.7)';
        } else {
          badgeEl.style.color = '#86efac';
          badgeEl.style.borderColor = 'rgba(16, 185, 129, 0.7)';
          glowEl.style.boxShadow = '0 0 22px rgba(16, 185, 129, 0.85)';
        }
      }
      if (phaseEl) {
        if (val < 25) phaseEl.textContent = '✨ نستحضر أبطال المغامرة...';
        else if (val < 55) phaseEl.textContent = '🌙 ننسج تفاصيل الحكاية الشيقة...';
        else if (val < 80) phaseEl.textContent = '🦸 نجهز الأسئلة والمفاجآت...';
        else if (val < 100) phaseEl.textContent = '📖 نضع اللمسات الأخيرة للقصة...';
      }
    };

    updateProgress(0);
    const progTimer = setInterval(() => {
      if (pct < 25) pct += 2.5;
      else if (pct < 55) pct += 1.8;
      else if (pct < 75) pct += 1.0;
      else if (pct < 88) pct += 0.5;
      else if (pct < 93) pct += 0.2;
      updateProgress(Math.min(Math.round(pct), 93));
    }, 110);

    try {
      // 1. Fetch Question
      this.question = await this.fetchQuestion();
      
      // 2. قصة النهاردة: (أ) كاش اليوم → (ب) خادم القصص بمفتاح مركزي → (ج) مفتاح شخصي إن وجد → (د) المكتبة المحلية
      const dayKey = this.todayKey();
      const cached = this.loadDailyCache(dayKey);
      if (cached) {
        this.currentStory = cached.story;
        this.setSubtitle(cached.source === 'bank' ? 'قصة النهاردة من المكتبة 📚' : 'قصة النهاردة ✨');
      } else {
        let source = null;
        try {
          this.currentStory = await this.generateStoryFromServer(dayKey);
          source = 'server';
        } catch (err) {
          console.warn('Story server failed:', err);
          if (this.apiKey) {
            try {
              this.currentStory = await this.generateStoryWithGemini();
              source = 'personal';
            } catch (err2) {
              console.error('Gemini error:', err2);
            }
          }
        }
        if (!this.currentStory) {
          this.currentStory = await this.getBankStory(dayKey);
          source = 'bank';
          if (!navigator.onLine) UI.toast('مفيش نت.. هنقرأ قصة من المكتبة 📚', { type: 'info' });
        }
        this.saveDailyCache(dayKey, this.currentStory, source);
        this.setSubtitle(source === 'bank' ? 'قصة النهاردة من المكتبة 📚' : 'قصة جديدة مخصوصة لك ✨');
      }
    } finally {
      clearInterval(progTimer);
      // Fast smooth ramp to 100%
      await new Promise(resolve => {
        const startVal = pct;
        const startTime = performance.now();
        const duration = 400;
        const step = (now) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const current = Math.round(startVal + (100 - startVal) * progress);
          updateProgress(current);
          if (progress < 1) {
            requestAnimationFrame(step);
          } else {
            updateProgress(100);
            if (phaseEl) {
              phaseEl.textContent = `🎉 الحكاية جاهزة.. استعد يا ${isGirl ? 'بطلة' : 'بطل'}!`;
            }
            if (badgeEl) {
              badgeEl.style.color = '#4ade80';
              badgeEl.style.borderColor = '#10b981';
              badgeEl.style.background = 'linear-gradient(145deg, #064e3b, #022c22)';
            }
            if (glowEl) {
              glowEl.style.boxShadow = '0 0 28px rgba(16, 185, 129, 1)';
            }
            if (window.KidsTheme && typeof KidsTheme.play === 'function') {
              try { KidsTheme.play('star'); } catch(e) {}
            }
            setTimeout(resolve, 550);
          }
        };
        requestAnimationFrame(step);
      });
    }

    // 3. Start Story
    this.showView('story');
    this.renderChapter();
  }

  showView(viewName) {
    Object.values(this.views).forEach(v => v.classList.remove('active'));
    this.views[viewName].classList.add('active');
    if (viewName === 'finish') {
      const finishH2 = document.querySelector('#finish-view h2');
      if (finishH2) {
        finishH2.textContent = this.childData.gender === 'girl'
          ? 'تصبحين على خير يا بطلة! 🌸'
          : 'تصبح على خير يا بطل! 🌟';
      }
    }
  }

  // ---------- قصة اليوم: كاش + خادم + مكتبة ----------
  todayKey() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  childKey() {
    const d = this.childData;
    return d.name + '|' + d.gender + '|' + d.age;
  }

  setSubtitle(text) {
    const el = document.getElementById('story-subtitle');
    if (el) el.textContent = text;
  }

  loadDailyCache(dayKey) {
    try {
      const raw = localStorage.getItem('story_daily_v1');
      if (!raw) return null;
      const c = JSON.parse(raw);
      if (c && c.day === dayKey && c.child === this.childKey() && c.story && Array.isArray(c.story.chapters) && c.story.chapters.length === 4) return c;
    } catch (_) {}
    return null;
  }

  saveDailyCache(dayKey, story, source) {
    try {
      localStorage.setItem('story_daily_v1', JSON.stringify({ day: dayKey, child: this.childKey(), story, source }));
    } catch (_) {}
  }

  storyApiUrl() {
    const h = location.hostname;
    const sameHost = h.endsWith('vercel.app') || h === 'localhost' || h === '127.0.0.1';
    return sameHost ? '/api/story' : 'https://kids-quiz-umber.vercel.app/api/story';
  }

  async generateStoryFromServer(dayKey) {
    if (!navigator.onLine) throw new Error('offline');
    const d = this.childData;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 40000);
    try {
      const res = await fetch(this.storyApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          name: d.name, gender: d.gender, age: d.age,
          father: d.father, mother: d.mother, siblings: d.siblings, friend: d.friend,
          seed: dayKey + '|' + this.childKey()
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.story) throw new Error(data.error || ('HTTP ' + res.status));
      if (!Array.isArray(data.story.chapters) || data.story.chapters.length !== 4) throw new Error('bad story');
      return data.story;
    } finally {
      clearTimeout(timer);
    }
  }

  hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  formatTemplate(text) {
    const d = this.childData;
    const isGirl = d.gender === 'girl';
    let t = String(text || '')
      .replace(/\{name\}/g, d.name)
      .replace(/\{friend\}/g, d.friend)
      .replace(/\{father\}/g, d.father)
      .replace(/\{mother\}/g, d.mother)
      .replace(/\{siblings\}/g, d.siblings);
    // صيغة {g:مذكر|مؤنث}
    t = t.replace(/\{g:([^|]+)\|([^}]+)\}/g, (_, m, f) => isGirl ? f.trim() : m.trim());
    return t;
  }

  // المكتبة المحلية الكبيرة (stories-bank.json): قصة مختلفة كل يوم لكل طفل، بدون إنترنت
  async getBankStory(dayKey) {
    try {
      const res = await fetch('stories-bank.json');
      if (res.ok) {
        const bank = await res.json();
        const list = (bank.stories || []).filter(s => s && s.boy && s.girl);
        if (list.length) {
          const dayNum = Math.floor(new Date(dayKey + 'T12:00:00').getTime() / 86400000);
          const idx = (dayNum + this.hashStr(this.childKey())) % list.length;
          const s = list[idx];
          const v = this.childData.gender === 'girl' ? s.girl : s.boy;
          return {
            title: this.formatTemplate(v.title),
            emoji: s.emoji || '🌙',
            chapters: v.chapters.map(ch => ({ title: this.formatTemplate(ch.title), text: this.formatTemplate(ch.text), emoji: ch.emoji }))
          };
        }
      }
    } catch (err) {
      console.warn('Story bank unavailable, using built-in stories', err);
    }
    return this.getFallbackStory();
  }

  getFallbackStory() {
    const dayNum = Math.floor(Date.now() / 86400000);
    const template = FALLBACK_STORIES[(dayNum + this.hashStr(this.childKey())) % FALLBACK_STORIES.length];
    return {
      title: this.formatTemplate(template.title),
      emoji: template.emoji,
      chapters: template.chapters.map(ch => ({
        title: this.formatTemplate(ch.title),
        text: this.formatTemplate(ch.text),
        emoji: ch.emoji
      }))
    };
  }

  async generateStoryWithGemini() {
    const key = (this.apiKey || '').trim().replace(/^["']|["']$/g, '');
    if (!key) throw new Error('مفتاح Gemini غير موجود');

    const d = this.childData;
    const isGirl = d.gender === 'girl';
    const themes = ["مغامرة في الفضاء", "رحلة في الغابة", "البحث عن كنز", "السفر عبر الزمن", "بطل خارق ينقذ المدينة", "رحلة تحت البحر", "اختراع عجيب", "عالم الأحلام السحري"];
    const randomTheme = themes[Math.floor(Math.random() * themes.length)];
    
    const prompt = `أنت راوي قصص أطفال مصري بارع ودافئ. اكتب قصة نوم شيقة وممتعة ومفصلة من 4 فصول غنية بالأحداث والتفاصيل اللطيفة المناسبة للأطفال قبل النوم (كل فصل يتكون من 4 إلى 7 جمل مفصلة - ضعف الطول المعتاد).
الطفل: "${d.name}"، الجنس: ${isGirl ? 'بنت (أنثى) - يجب استخدام صيغة المؤنث بدقة تامة في كافة الأفعال والصفات والضمائر الموجهة للبطلة أو التي تتحدث عنها' : 'ولد (ذكر) - استخدام صيغة المذكر في الأفعال والصفات والضمائر'}، العمر: ${d.age} سنوات.

الشخصيات:
- ${isGirl ? 'البطلة' : 'البطل'}: ${d.name}
- الأب: ${d.father}
- الأم: ${d.mother}
- الإخوة: ${d.siblings}
- الأصدقاء: ${d.friend}

الموضوع: ${randomTheme}

القواعد الصارمة:
1. اكتب بالعامية المصرية الراقية والجميلة والمحبوبة للأطفال قبل النوم.
2. اجعل كل فصل غنياً بالتفاصيل والأحداث والتشويق اللطيف والوصف الحسي المريح (ضعف الحجم: 4 إلى 7 جمل كاملة لكل فصل).
3. اضبط الأفعال والصفات والضمائر بدقة تامة لتناسب ${isGirl ? 'البنت (مؤنث)' : 'الولد (مذكر)'}.
4. الفصل الثاني ينتهي بعقدة أو لغز يتطلب إجابة سؤال، وفي نهايته اكتب هذا الوسم فقط وبدون مسافات إضافية: [QUESTION_HERE]
5. الفصل الثالث يبدأ بـ "${isGirl ? `بعد ما ${d.name} فكرت بذكاء وشطارة وجاوبت صح...` : `بعد ما ${d.name} فكر بذكاء وشطارة وجاوب صح...`}" ويكمل القصة بنجاح.
6. الفصل الرابع ختام دافئ ومشجع يساعد على النوم الهادئ ويعزز المحبة الأسرية.

أرجع JSON فقط بهذا الشكل وبدون أي كود ماركداون إضافي:
{"title":"عنوان القصة","emoji":"🌟","chapters":[{"title":"عنوان الفصل 1","text":"نص الفصل 1 المفصل...","emoji":"🚀"},{"title":"عنوان الفصل 2","text":"نص الفصل 2 المفصل... [QUESTION_HERE]","emoji":"❓"},{"title":"عنوان الفصل 3","text":"نص الفصل 3 المفصل...","emoji":"✨"},{"title":"عنوان الفصل 4","text":"نص الفصل 4 المفصل...","emoji":"🌙"}]}
`;

    // Discover supported model for this specific key
    const resolved = await this.resolveModel(key);
    const modelsToTry = [resolved.model, 'gemini-3.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.5-flash'].filter((v, i, a) => a.indexOf(v) === i);
    let lastError = null;

    for (const model of modelsToTry) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/${resolved.version || 'v1beta'}/models/${model}:generateContent?key=${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              responseMimeType: "application/json"
            },
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
            ]
          })
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          const errMsg = errBody?.error?.message || `HTTP ${res.status}`;
          if (res.status === 400 && (errMsg.includes('API_KEY_INVALID') || errMsg.includes('API key not valid'))) {
            throw new Error('مفتاح Gemini غير صالح أو به خطأ في النسخ 🔑');
          }
          if (res.status === 429 || errMsg.includes('Quota') || errMsg.includes('exhausted')) {
            throw new Error('تم استهلاك الحصة المجانية للمفتاح حالياً ⏳');
          }
          if (res.status === 403) {
            throw new Error('مفتاح Gemini مقيّد أو غير مفعّل 🚫');
          }
          if (res.status === 404) {
            console.warn(`Model ${model} returned 404, trying next model...`);
            if (localStorage.getItem('gemini_working_model') === model) localStorage.removeItem('gemini_working_model');
            lastError = new Error(errMsg);
            continue;
          }
          throw new Error(errMsg);
        }

        const data = await res.json();
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
          if (data.promptFeedback?.blockReason) {
            throw new Error(`حجب أمني من جوجل: ${data.promptFeedback.blockReason}`);
          }
          throw new Error('لم يرجع الذكاء الاصطناعي رداً');
        }

        const textRes = data.candidates[0].content.parts[0].text;
        const storyJson = this.parseStoryJson(textRes);
        
        if (!storyJson.chapters || storyJson.chapters.length !== 4) {
          throw new Error('تنسيق القصة غير مكتمل');
        }
        
        // Cache working model for future fast calls
        localStorage.setItem('gemini_working_model', model);
        return storyJson;
      } catch (err) {
        lastError = err;
        if (err.message && (err.message.includes('غير صالح') || err.message.includes('مقيّد') || err.message.includes('الحصة'))) {
          throw err;
        }
      }
    }

    throw lastError || new Error('تعذر توليد القصة بالذكاء الاصطناعي');
  }

  async resolveModel(key) {
    const cached = localStorage.getItem('gemini_working_model');
    const version = localStorage.getItem('gemini_api_version') || 'v1beta';

    if (cached) {
      return { model: cached, version };
    }

    try {
      const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
      if (listRes.ok) {
        const listData = await listRes.json();
        if (listData.models && Array.isArray(listData.models)) {
          const available = listData.models
            .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
            .map(m => m.name.replace(/^models\//, ''));
          
          const priority = [
            'gemini-3.5-flash-lite',
            'gemini-flash-lite-latest',
            'gemini-3.5-flash',
            'gemini-flash-latest',
            'gemini-2.5-flash'
          ];
          for (const p of priority) {
            if (available.includes(p)) {
              localStorage.setItem('gemini_working_model', p);
              return { model: p, version: 'v1beta' };
            }
          }
          const anyFlash = available.find(m => m.includes('flash'));
          const anyGemini = available.find(m => m.includes('gemini'));
          const chosen = anyFlash || anyGemini || available[0];
          if (chosen) {
            localStorage.setItem('gemini_working_model', chosen);
            return { model: chosen, version: 'v1beta' };
          }
        }
      }
    } catch (e) {
      console.warn('Could not list models, fallback to default', e);
    }

    return { model: 'gemini-3.5-flash-lite', version: 'v1beta' };
  }

  parseStoryJson(rawText) {
    try {
      return JSON.parse(rawText);
    } catch (_) {}

    let clean = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    try {
      return JSON.parse(clean);
    } catch (_) {}

    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(clean.slice(start, end + 1));
      } catch (_) {}
    }

    throw new Error('تعذر قراءة بيانات القصة المستلمة');
  }

  async fetchQuestion() {
    let cat = this.childData.grade;
    if (!['kids_1', 'kids_2', 'kids_3'].includes(cat)) cat = 'kids_2';
    
    try {
      // 1. Try to get from IndexedDB (already loaded by script.js)
      const db = await this.openDB();
      const cached = await this.idbGet(db, 'cat:' + cat);
      if (cached && cached.items && cached.items.length > 0) {
        return this.pickRandomQuestion(cached.items);
      }
      
      // 2. Not in DB? Let's fetch zip
      UI.toast('بنجهز الأسئلة أول مرة.. ثواني بس ⏳', { type: 'info' });
      const res = await fetch(`data/${cat}.zip`);
      const buffer = await res.arrayBuffer();
      const zip = await JSZip.loadAsync(buffer);
      const jsonFile = zip.file(`${cat}.json`);
      if (jsonFile) {
        const text = await jsonFile.async('string');
        const items = JSON.parse(text);
        return this.pickRandomQuestion(items);
      }
    } catch (err) {
      console.warn('Could not fetch real question, using fallback', err);
    }
    
    // Fallback simple question
    return {
      question: "كم يساوي ٥ + ٤ ؟",
      choice1: "٧",
      choice2: "٨",
      choice3: "٩",
      choice4: "١٠",
      correct_answer: "٩",
      emoji: "🧮"
    };
  }

  pickRandomQuestion(items) {
    const valid = items.filter(q => q && q.question && q.choice1 && q.correct_answer);
    return valid[Math.floor(Math.random() * valid.length)];
  }

  renderChapter() {
    const ch = this.currentStory.chapters[this.currentChapter];
    document.getElementById('story-title').textContent = this.currentStory.title;
    document.getElementById('chapter-badge').textContent = `فصل ${this.currentChapter + 1} / 4`;
    document.getElementById('progress-fill').style.width = `${((this.currentChapter + 1) / 4) * 100}%`;
    
    document.getElementById('chapter-emoji').textContent = ch.emoji || '✨';
    document.getElementById('chapter-title').textContent = ch.title || '';
    
    // Parse text for question marker
    const hasQuestion = ch.text.includes('[QUESTION_HERE]');
    let safeText = ch.text.replace('[QUESTION_HERE]', '').trim();
    document.getElementById('chapter-text').textContent = safeText;
    
    // Update Question Area
    if (hasQuestion && this.question) {
      this.qArea.style.display = 'block';
      this.btnNext.style.display = 'none'; // Must answer to proceed
      document.getElementById('q-text').textContent = (this.question.emoji ? this.question.emoji + ' ' : '') + this.question.question;
      
      const choices = [this.question.choice1, this.question.choice2, this.question.choice3, this.question.choice4];
      choices.sort(() => Math.random() - 0.5); // shuffle
      
      const grid = document.getElementById('choices-grid');
      grid.innerHTML = '';
      choices.forEach(c => {
        if (!c) return;
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.textContent = c;
        btn.onclick = () => this.handleAnswer(btn, c);
        grid.appendChild(btn);
      });
    } else {
      this.qArea.style.display = 'none';
      this.btnNext.style.display = 'block';
    }

    // Update controls
    this.btnPrev.disabled = this.currentChapter === 0;
    
    if (this.currentChapter === this.currentStory.chapters.length - 1) {
      this.btnNext.textContent = 'النهاية 🌟';
      this.btnNext.classList.replace('primary', 'success');
    } else {
      this.btnNext.textContent = 'التالي ➔';
      this.btnNext.classList.replace('success', 'primary');
    }
    
    // Auto-read if enabled
    if (localStorage.getItem('kids_read') !== 'off') {
      setTimeout(() => this.readCurrentChapter(), 300);
    }
  }

  handleAnswer(btn, answer) {
    if (this.answered) return;
    
    const isCorrect = answer === this.question.correct_answer;
    
    if (isCorrect) {
      this.answered = true;
      btn.classList.add('correct');
      if (window.KidsTheme) KidsTheme.play('star');
      
      // Add piggy bank points
      let step = parseInt(localStorage.getItem('piggyStep')) || 10;
      let bal = parseInt(localStorage.getItem('piggyBalance')) || 0;
      localStorage.setItem('piggyBalance', bal + step);
      document.getElementById('piggy-ui-wrap').style.display = 'inline-block';
      document.getElementById('piggy-ui').textContent = (bal + step) + ' قرش';
      
      setTimeout(() => {
        this.nextChapter();
      }, 1500);
    } else {
      btn.classList.add('wrong');
      if (window.KidsTheme) KidsTheme.play('wrong');
      btn.disabled = true;
    }
  }

  nextChapter() {
    if (this.currentChapter < this.currentStory.chapters.length - 1) {
      this.currentChapter++;
      this.answered = false;
      this.renderChapter();
    } else {
      // Finish
      if (window.KidsTheme) KidsTheme.play('fanfare');
      this.showView('finish');
    }
  }

  prevChapter() {
    if (this.currentChapter > 0) {
      this.currentChapter--;
      this.answered = false;
      this.renderChapter();
    }
  }

  readCurrentChapter() {
    if (!window.KidsTheme) return;
    const ch = this.currentStory.chapters[this.currentChapter];
    let txtToRead = ch.text.replace('[QUESTION_HERE]', '');
    if (this.qArea.style.display !== 'none' && this.question) {
      txtToRead += ' .. ' + this.question.question;
    }
    KidsTheme.speak(txtToRead);
  }

  // --- Minimal IndexedDB Helper ---
  openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('QuranDB', 1);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('quranData')) db.createObjectStore('quranData');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  idbGet(db, key) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('quranData', 'readonly');
      const store = tx.objectStore('quranData');
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
}

// Start
document.addEventListener('DOMContentLoaded', () => {
  window.app = new StoryEngine();
});
