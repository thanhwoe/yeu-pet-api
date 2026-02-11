export interface OtpJobData {
  phone?: string;
  email?: string;
  userName?: string;
  token: string;
}

export interface SendOtpJobParams extends OtpJobData {
  jobName: string;
}
