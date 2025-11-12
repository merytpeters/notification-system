import { EmailService } from './email/email.service';
import 'dotenv/config';

// Mock classes
class MockTemplateClient {
  async getTemplate(templateId: string) {
    return {
      subject: 'Welcome to MyApp',
      content: 'Hello {{username}}, please verify your account here: {{link}}',
    };
  }
}

class MockRetryService {
  async handleRetry(message: any, queue: string, attempt: number) {
    console.log('⚠️ Retry triggered for message:', message);
  }
}

async function main() {
  const emailService = new EmailService(
    new MockTemplateClient() as any,
    new MockRetryService() as any,
  );

  await emailService.processEmail({
    notification_id: 'test-123',
    to: 'uchenna@renda.co',
    templateId: 'welcome',
    variables: { username: 'Uchenna', link: 'https://yourapp.com/verify' },
  });

  console.log('✅ Test finished');
}

main().catch(console.error);

// import 'dotenv/config';
// import { EmailService } from '../email/email.service';

// // 🧩 Mock Template Client
// class MockTemplateClient {
//   async getTemplate(templateId: string) {
//     return {
//       subject: 'Welcome to MyApp!',
//       content:
//         '<h1>Hello {{username}}</h1><p>Click to verify: <a href="{{link}}">Verify</a></p>',
//     };
//   }
// }

// // 🧩 Mock Retry Service
// class MockRetryService {
//   async handleRetry(message: any, queue: string, attempt: number) {
//     console.log(
//       `⚠️ Retrying message for ${message.to} on ${queue}, attempt ${attempt}`,
//     );
//   }
// }

// async function main() {
//   const emailService = new EmailService(
//     new MockTemplateClient() as any,
//     new MockRetryService() as any,
//   );

//   await emailService.processEmail({
//     to: 'williamseneojo@gmail.com', // ✅ use your real verified email
//     templateId: 'welcome',
//     variables: {
//       username: 'Williams',
//       link: 'https://yourapp.com/verify',
//     },
//   });

//   console.log('✅ Email test finished');
// }

// main().catch(console.error);
