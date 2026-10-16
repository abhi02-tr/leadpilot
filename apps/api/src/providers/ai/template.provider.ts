import type { AIProvider, GeneratePrompt, GeneratedContent, AIProviderStatus } from './types.js';

const TEMPLATE_VERSION = '1.0.0';

function buildEmailTemplate(p: GeneratePrompt): GeneratedContent {
  const greeting = getGreeting(p.language, p.tone);
  const locationStr = p.city ? ` in ${p.city}` : '';
  const businessName = p.leadBusinessName;
  const niche = p.niche ?? p.campaignNiche ?? 'business';
  const offer = p.campaignOffer ?? 'our platform';

  let subject = '';
  let content = '';

  if (p.language === 'english') {
    subject = `Quick idea for ${businessName}`;
    if (p.objective === 'start_conversation') {
      content = `${greeting},

I came across ${businessName}${locationStr} and was impressed by your ${niche} work.

I'm reaching out because I noticed that many ${niche} businesses${locationStr} are finding it easier to reach more customers with an online presence. At BizzPocket, we help businesses like yours get started online quickly and affordably.

Would you be open to a quick conversation to explore whether this could be useful for ${businessName}?

Looking forward to hearing from you.

Best regards`;
    } else if (p.objective === 'book_demo') {
      subject = `Can I show you something for ${businessName}?`;
      content = `${greeting},

I'd love to show you how ${businessName} could benefit from having an online store. BizzPocket makes it simple to set up and start selling online.

Would you have 15 minutes this week for a quick demo?

Best regards`;
    } else if (p.objective === 'follow_up') {
      subject = `Following up — ${businessName}`;
      content = `${greeting},

I wanted to follow up on my previous message about helping ${businessName} get online. I understand you're busy, so I'll keep this brief.

Is this something you'd be interested in exploring?

Best regards`;
    } else {
      subject = `A quick note for ${businessName}`;
      content = `${greeting},

I'd love to share some information about how ${businessName} could benefit from ${offer}. Would it be okay if I sent over a few details?

Best regards`;
    }
  } else if (p.language === 'hindi') {
    subject = `${businessName} के लिए एक सुझाव`;
    content = `नमस्ते,

मैं ${businessName} के बारे में जानकर प्रभावित हुआ। क्या आप अपने व्यवसाय को ऑनलाइन ले जाने में रुचि रखते हैं?

BizzPocket आपको आसानी से और जल्दी ऑनलाइन स्टोर शुरू करने में मदद कर सकता है।

क्या हम इस बारे में बात कर सकते हैं?

धन्यवाद`;
  } else if (p.language === 'gujarati') {
    subject = `${businessName} માટે એક વિચાર`;
    content = `નમસ્તે,

${businessName} વિશે જાણીને ખૂબ સારું લાગ્યું. શું તમે તમારો વ્યવસાય ઓનલાઈન લઈ જવા માટે રસ ધરાવો છો?

BizzPocket સાથે, તમે સરળતાથી ઓનલાઈન સ્ટોર શરૂ કરી શકો છો.

શું આપણે આ વિષે વાત કરી શકીએ?

આભાર`;
  } else {
    // hinglish
    subject = `${businessName} ke liye ek idea`;
    content = `Hi,

Maine ${businessName} ke baare mein suna aur bahut acha laga. Kya aap apne business ko online le jaana chahenge?

BizzPocket ke through aap easily apna online store shuru kar sakte hain — quickly aur affordable.

Ek baar baat karte hain?

Thanks`;
  }

  return {
    subject,
    content,
    provider: 'template',
    templateVersion: TEMPLATE_VERSION,
  };
}

function buildInstagramTemplate(p: GeneratePrompt): GeneratedContent {
  const businessName = p.leadBusinessName;
  let content = '';

  if (p.language === 'english') {
    content = `Hi! I came across ${businessName} and love what you do 🙌 I wanted to share a quick idea that could help you reach more customers online. Would you be open to a brief chat? No sales pressure — just an idea worth exploring!`;
  } else if (p.language === 'hindi') {
    content = `नमस्ते! ${businessName} को देखकर बहुत अच्छा लगा 🙌 आपके business को online ले जाने के बारे में एक idea share करना चाहता था। क्या हम बात कर सकते हैं?`;
  } else if (p.language === 'gujarati') {
    content = `નમસ્તે! ${businessName} જોઈને ખૂબ ગમ્યું 🙌 તમારા business ને online લઈ જવા વિશે એક idea share કરવા ઇચ્છું છું. શું આપણે વાત કરી શકીએ?`;
  } else {
    content = `Hi! ${businessName} dekh ke bahut acha laga 🙌 Ek quick idea share karna tha jo aapke business ko online laane mein help kar sake. Ek baar baat karte hain?`;
  }

  return { content, provider: 'template', templateVersion: TEMPLATE_VERSION };
}

function buildWhatsAppTemplate(p: GeneratePrompt): GeneratedContent {
  const businessName = p.leadBusinessName;
  let content = '';

  if (p.language === 'english') {
    content = `Hello! I'm reaching out regarding ${businessName}. I have a quick idea that could help your business grow online. Would you be interested in a brief conversation? I'll keep it short and to the point. Thank you!`;
  } else if (p.language === 'hindi') {
    content = `नमस्ते! मैं ${businessName} के बारे में बात करना चाहता था। आपके business को online grow करने का एक आसान तरीका है। क्या 2 मिनट बात कर सकते हैं? धन्यवाद!`;
  } else if (p.language === 'gujarati') {
    content = `નમસ્તે! ${businessName} વિશે વાત કરવા ઇચ્છતો હતો. તમારા business ને online grow કરવાનો એક સરળ રસ્તો છે. 2 મિનિટ વાત કરી શકાય? આભાર!`;
  } else {
    content = `Hello! ${businessName} ke baare mein baat karna chahta tha. Aapke business ko online badhane ka ek aasan tarika hai. Kya 2 minute baat kar sakte hain? Thank you!`;
  }

  return { content, provider: 'template', templateVersion: TEMPLATE_VERSION };
}

function getGreeting(language: string, _tone: string): string {
  const greetings: Record<string, string> = {
    english: 'Hello',
    hindi: 'नमस्ते',
    gujarati: 'નમસ્તે',
    hinglish: 'Hi',
  };
  return greetings[language] ?? 'Hello';
}

export class TemplateProvider implements AIProvider {
  readonly id = 'template';
  readonly name = 'Template Generator';

  isConfigured(): boolean { return true; }
  async checkAvailability(): Promise<boolean> { return true; }

  async generate(prompt: GeneratePrompt): Promise<GeneratedContent> {
    switch (prompt.channel) {
      case 'email': return buildEmailTemplate(prompt);
      case 'instagram': return buildInstagramTemplate(prompt);
      case 'whatsapp': return buildWhatsAppTemplate(prompt);
      default: return buildEmailTemplate(prompt);
    }
  }

  async getStatus(): Promise<AIProviderStatus> {
    return { id: this.id, name: this.name, isConfigured: true, isAvailable: true };
  }
}
