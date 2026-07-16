import { Resend } from 'resend'
import { env } from '../config/env'
import { logger } from './logger'

// Initialize Resend client
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null

// Email templates
interface EmailTemplate {
  subject: string
  html: string
}

// Locale-aware email content
const emailContent = {
  ar: {
    agentApplicationApproved: {
      subject: 'تم قبول طلب وكيل العقارات الخاص بك',
      html: (name: string) => `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>مرحباً ${name}،</h2>
          <p>يسرنا إبلاغك بأن طلبك للانضمام كوكيل عقارات في بايارا قد تم قبوله.</p>
          <p>يمكنك الآن البدء في إدراج عقاراتك والوصول إلى آلاف المشترين والمستأجرين المؤهلين.</p>
          <p>قم بتسجيل الدخول إلى بوابة الوكيل للبدء:</p>
          <a href="${env.FRONTEND_URL}/agent/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">الذهاب إلى لوحة التحكم</a>
          <p>تحياتنا،<br>فريق بايارا للعقارات</p>
        </div>
      `,
    },
    agentApplicationRejected: {
      subject: 'تم رفض طلب وكيل العقارات الخاص بك',
      html: (name: string, reason?: string) => `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>مرحباً ${name}،</h2>
          <p>نأسف لإبلاغك بأن طلبك للانضمام كوكيل عقارات في بايارا قد تم رفضه.</p>
          ${reason ? `<p>السبب: ${reason}</p>` : ''}
          <p>يمكنك تقديم طلب جديد بعد معالجة أسباب الرفض.</p>
          <p>تحياتنا،<br>فريق بايارا للعقارات</p>
        </div>
      `,
    },
    newLeadNotification: {
      subject: 'استفسار جديد عن عقار',
      html: (agentName: string, propertyTitle: string, leadName: string, leadEmail: string, leadPhone: string | null, leadMessage: string) => `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>مرحباً ${agentName}،</h2>
          <p>لديك استفسار جديد عن عقارك: ${propertyTitle}</p>
          <p><strong>الاسم:</strong> ${leadName}</p>
          <p><strong>البريد الإلكتروني:</strong> ${leadEmail}</p>
          ${leadPhone ? `<p><strong>الهاتف:</strong> ${leadPhone}</p>` : ''}
          <p><strong>الرسالة:</strong> ${leadMessage}</p>
          <p>قم بتسجيل الدخول إلى بوابة الوكيل لمتابعة الاستفسار:</p>
          <a href="${env.FRONTEND_URL}/agent/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">الذهاب إلى لوحة التحكم</a>
        </div>
      `,
    },
    viewingDepositConfirmed: {
      subject: 'تم تأكيد حجز المعاينة',
      html: (userName: string, propertyTitle: string, scheduledDate: string, depositAmount: number) => `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>مرحباً ${userName}،</h2>
          <p>تم تأكيد حجز معاينة العقار: ${propertyTitle}</p>
          <p><strong>التاريخ:</strong> ${scheduledDate}</p>
          <p><strong>مبلغ الحجز:</strong> ${depositAmount} درهم إماراتي</p>
          <p>سيتم تحويل المبلغ إلى الوكيل بعد حضور المعاينة.</p>
          <p>تحياتنا،<br>فريق بايارا للعقارات</p>
        </div>
      `,
    },
    viewingCancelled: {
      subject: 'تم إلغاء حجز المعاينة',
      html: (userName: string, propertyTitle: string, refundAmount: number) => `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>مرحباً ${userName}،</h2>
          <p>تم إلغاء حجز معاينة العقار: ${propertyTitle}</p>
          <p><strong>مبلغ الاسترداد:</strong> ${refundAmount} درهم إماراتي</p>
          <p>سيتم تحويل المبلغ المسترد إلى حسابك خلال 3-5 أيام عمل.</p>
          <p>تحياتنا،<br>فريق بايارا للعقارات</p>
        </div>
      `,
    },
    paymentFailed: {
      subject: 'فشل عملية الدفع',
      html: (userName: string, amount: number, purpose: string) => `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>مرحباً ${userName}،</h2>
          <p>فشلت عملية الدفع البالغة ${amount} درهم إماراتي لـ ${purpose}.</p>
          <p>يمكنك إعادة المحاولة من خلال الرابط التالي:</p>
          <a href="${env.FRONTEND_URL}/agent/billing" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">إعادة المحاولة</a>
          <p>إذا استمرت المشكلة، يرجى التواصل معنا.</p>
          <p>تحياتنا،<br>فريق بايارا للعقارات</p>
        </div>
      `,
    },
    savedSearchNewMatch: {
      subject: 'عقارات جديدة تطابق بحثك المحفوظ',
      html: (userName: string, matchCount: number) => `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>مرحباً ${userName}،</h2>
          <p>وجدنا ${matchCount} عقارات جديدة تطابق بحثك المحفوظ.</p>
          <p>قم بزيارة الموقع لعرض العقارات:</p>
          <a href="${env.FRONTEND_URL}/properties" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">عرض العقارات</a>
          <p>تحياتنا،<br>فريق بايارا للعقارات</p>
        </div>
      `,
    },
    propertyReservationConfirmed: {
      subject: 'تم حجز عقارك بنجاح',
      html: (agentName: string, propertyTitle: string, buyerName: string, buyerEmail: string, buyerPhone: string | null) => `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>مرحباً ${agentName}،</h2>
          <p>لقد تم حجز عقارك <strong>${propertyTitle}</strong> من قِبل مشتري.</p>
          <p><strong>اسم المشتري:</strong> ${buyerName}</p>
          <p><strong>البريد الإلكتروني:</strong> ${buyerEmail}</p>
          ${buyerPhone ? `<p><strong>الهاتف:</strong> ${buyerPhone}</p>` : ''}
          <p>يمكنك الاطلاع على تفاصيل الحجز من خلال صفحة المعاملات:</p>
          <a href="${env.FRONTEND_URL}/agent/transactions" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">عرض المعاملات</a>
          <p>تحياتنا،<br>فريق بايارا للعقارات</p>
        </div>
      `,
    },
  },
  en: {
    agentApplicationApproved: {
      subject: 'Your Agent Application Has Been Approved',
      html: (name: string) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello ${name},</h2>
          <p>We're pleased to inform you that your application to join Bayara as a real estate agent has been approved.</p>
          <p>You can now start listing your properties and reach thousands of qualified buyers and tenants.</p>
          <p>Log in to your agent portal to get started:</p>
          <a href="${env.FRONTEND_URL}/agent/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Go to Dashboard</a>
          <p>Best regards,<br>Bayara Real Estate Team</p>
        </div>
      `,
    },
    agentApplicationRejected: {
      subject: 'Your Agent Application Has Been Rejected',
      html: (name: string, reason?: string) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello ${name},</h2>
          <p>We regret to inform you that your application to join Bayara as a real estate agent has been rejected.</p>
          ${reason ? `<p>Reason: ${reason}</p>` : ''}
          <p>You may submit a new application after addressing the reasons for rejection.</p>
          <p>Best regards,<br>Bayara Real Estate Team</p>
        </div>
      `,
    },
    newLeadNotification: {
      subject: 'New Property Inquiry',
      html: (agentName: string, propertyTitle: string, leadName: string, leadEmail: string, leadPhone: string | null, leadMessage: string) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello ${agentName},</h2>
          <p>You have a new inquiry about your property: ${propertyTitle}</p>
          <p><strong>Name:</strong> ${leadName}</p>
          <p><strong>Email:</strong> ${leadEmail}</p>
          ${leadPhone ? `<p><strong>Phone:</strong> ${leadPhone}</p>` : ''}
          <p><strong>Message:</strong> ${leadMessage}</p>
          <p>Log in to your agent portal to follow up:</p>
          <a href="${env.FRONTEND_URL}/agent/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Go to Dashboard</a>
        </div>
      `,
    },
    viewingDepositConfirmed: {
      subject: 'Viewing Deposit Confirmed',
      html: (userName: string, propertyTitle: string, scheduledDate: string, depositAmount: number) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello ${userName},</h2>
          <p>Your viewing deposit for ${propertyTitle} has been confirmed.</p>
          <p><strong>Date:</strong> ${scheduledDate}</p>
          <p><strong>Deposit Amount:</strong> AED ${depositAmount}</p>
          <p>The deposit will be transferred to the agent after the viewing is completed.</p>
          <p>Best regards,<br>Bayara Real Estate Team</p>
        </div>
      `,
    },
    viewingCancelled: {
      subject: 'Viewing Cancelled',
      html: (userName: string, propertyTitle: string, refundAmount: number) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello ${userName},</h2>
          <p>Your viewing for ${propertyTitle} has been cancelled.</p>
          <p><strong>Refund Amount:</strong> AED ${refundAmount}</p>
          <p>The refund will be processed to your account within 3-5 business days.</p>
          <p>Best regards,<br>Bayara Real Estate Team</p>
        </div>
      `,
    },
    paymentFailed: {
      subject: 'Payment Failed',
      html: (userName: string, amount: number, purpose: string) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello ${userName},</h2>
          <p>Your payment of AED ${amount} for ${purpose} has failed.</p>
          <p>You can retry the payment using the link below:</p>
          <a href="${env.FRONTEND_URL}/agent/billing" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Retry Payment</a>
          <p>If the issue persists, please contact us.</p>
          <p>Best regards,<br>Bayara Real Estate Team</p>
        </div>
      `,
    },
    savedSearchNewMatch: {
      subject: 'New Properties Match Your Saved Search',
      html: (userName: string, matchCount: number) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello ${userName},</h2>
          <p>We found ${matchCount} new properties that match your saved search.</p>
          <p>Visit the site to view the properties:</p>
          <a href="${env.FRONTEND_URL}/properties" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">View Properties</a>
          <p>Best regards,<br>Bayara Real Estate Team</p>
        </div>
      `,
    },
    propertyReservationConfirmed: {
      subject: 'Your Property Has Been Reserved',
      html: (agentName: string, propertyTitle: string, buyerName: string, buyerEmail: string, buyerPhone: string | null) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello ${agentName},</h2>
          <p>Your property <strong>${propertyTitle}</strong> has been reserved by a buyer.</p>
          <p><strong>Buyer Name:</strong> ${buyerName}</p>
          <p><strong>Buyer Email:</strong> ${buyerEmail}</p>
          ${buyerPhone ? `<p><strong>Buyer Phone:</strong> ${buyerPhone}</p>` : ''}
          <p>You can view the transaction details on your transactions page:</p>
          <a href="${env.FRONTEND_URL}/agent/transactions" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">View Transactions</a>
          <p>Best regards,<br>Bayara Real Estate Team</p>
        </div>
      `,
    },
  },
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  if (!resend) {
    logger.warn('Email service not configured (RESEND_API_KEY missing)')
    return
  }

  try {
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM || 'Bayara <noreply@ahmedamer.dev>',
      to,
      subject,
      html,
    })

    if (error) {
      logger.error({ error, to, subject }, 'Failed to send email via Resend')
      return
    }

    logger.info({ emailId: data?.id, to }, 'Email sent successfully')
  } catch (error) {
    logger.error({ error, to, subject }, 'Error sending email')
  }
}

export async function sendAgentApplicationEmail({
  agentEmail,
  agentName,
  locale,
  decision,
  reason,
}: {
  agentEmail: string
  agentName: string
  locale: 'ar' | 'en'
  decision: 'APPROVED' | 'REJECTED'
  reason?: string
}) {
  const content = emailContent[locale]
  const template =
    decision === 'APPROVED'
      ? content.agentApplicationApproved
      : content.agentApplicationRejected

  await sendEmail({
    to: agentEmail,
    subject: template.subject,
    html: template.html(agentName, reason),
  })
}

export async function sendNewLeadEmail({
  agentEmail,
  agentName,
  propertyTitle,
  leadName,
  leadEmail,
  leadPhone,
  leadMessage,
  locale,
}: {
  agentEmail: string
  agentName: string
  propertyTitle: string
  leadName: string
  leadEmail: string
  leadPhone: string | null
  leadMessage: string
  locale: 'ar' | 'en'
}) {
  const content = emailContent[locale]
  const template = content.newLeadNotification

  await sendEmail({
    to: agentEmail,
    subject: template.subject,
    html: template.html(agentName, propertyTitle, leadName, leadEmail, leadPhone, leadMessage),
  })
}

export async function sendViewingDepositEmail({
  userEmail,
  userName,
  propertyTitle,
  scheduledDate,
  depositAmount,
  locale,
  isCancelled,
}: {
  userEmail: string
  userName: string
  propertyTitle: string
  scheduledDate: string
  depositAmount: number
  locale: 'ar' | 'en'
  isCancelled: boolean
}) {
  const content = emailContent[locale]
  await sendEmail({
    to: userEmail,
    subject: isCancelled ? content.viewingCancelled.subject : content.viewingDepositConfirmed.subject,
    html: isCancelled
      ? content.viewingCancelled.html(userName, propertyTitle, depositAmount)
      : content.viewingDepositConfirmed.html(userName, propertyTitle, scheduledDate, depositAmount),
  })
}

export async function sendPaymentFailedEmail({
  userEmail,
  userName,
  amount,
  purpose,
  locale,
}: {
  userEmail: string
  userName: string
  amount: number
  purpose: string
  locale: 'ar' | 'en'
}) {
  const content = emailContent[locale]
  const template = content.paymentFailed

  await sendEmail({
    to: userEmail,
    subject: template.subject,
    html: template.html(userName, amount, purpose),
  })
}

export async function sendSavedSearchAlertEmail({
  userEmail,
  userName,
  matchCount,
  locale,
}: {
  userEmail: string
  userName: string
  matchCount: number
  locale: 'ar' | 'en'
}) {
  const content = emailContent[locale]
  const template = content.savedSearchNewMatch

  await sendEmail({
    to: userEmail,
    subject: template.subject,
    html: template.html(userName, matchCount),
  })
}

export async function sendPropertyReservationEmail({
  agentEmail,
  agentName,
  propertyTitle,
  buyerName,
  buyerEmail,
  buyerPhone,
  locale,
}: {
  agentEmail: string
  agentName: string
  propertyTitle: string
  buyerName: string
  buyerEmail: string
  buyerPhone: string | null
  locale: 'ar' | 'en'
}) {
  const content = emailContent[locale]
  const template = content.propertyReservationConfirmed

  await sendEmail({
    to: agentEmail,
    subject: template.subject,
    html: template.html(agentName, propertyTitle, buyerName, buyerEmail, buyerPhone),
  })
}
