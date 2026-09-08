"use client";

import { useState, type ReactNode } from "react";
import { ChangePasswordModal } from "@/components/member-dashboard/change-password-modal";
import { memberPrimaryBtnClass } from "@/components/member-dashboard/member-button-styles";
import { MemberSelect } from "@/components/member-dashboard/member-select";
import { MemberDatePicker } from "@/components/member-dashboard/member-date-picker";
import { useMemberDashboard } from "@/components/member-dashboard/member-dashboard-provider";
import { SiteLoader } from "@/components/site-loader";
import {
  getMyCoupons,
  updateProfile,
  type MemberCoupon,
  type UserGender,
} from "@/lib/api";
import { getStoredToken } from "@/lib/auth-storage";

const genderOptions: { value: UserGender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const inlineFieldClass =
  "w-full max-w-[300px] rounded-[12px] border border-[#d7e0d6] bg-white px-3 py-2 text-[14px] font-semibold text-[#243028] outline-none transition focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15";

function formatMobile(mobile: string | null) {
  if (!mobile) return "—";
  const digits = mobile.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return mobile;
}

function formatGender(gender: UserGender | null) {
  if (!gender) return "—";
  return genderOptions.find((option) => option.value === gender)?.label ?? "—";
}

function formatDob(dateOfBirth: string | null) {
  if (!dateOfBirth) return "—";
  const date = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function isValidDob(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date <= today;
}

export function MemberAccountPage() {
  const { user, signOut, updateUser } = useMemberDashboard();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user.fullName);
  const [dateOfBirth, setDateOfBirth] = useState(user.dateOfBirth ?? "");
  const [gender, setGender] = useState<UserGender | "">(user.gender ?? "");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [couponsOpen, setCouponsOpen] = useState(false);
  const [assignedCoupons, setAssignedCoupons] = useState<MemberCoupon[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [couponsLoaded, setCouponsLoaded] = useState(false);
  const [couponsError, setCouponsError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  async function loadCoupons(force = false) {
    if (couponsLoading) return;
    if (couponsLoaded && !force) return;

    const token = getStoredToken();
    if (!token) {
      setCouponsError("Your session has expired. Please log in again.");
      setAssignedCoupons([]);
      setCouponsLoaded(true);
      return;
    }

    setCouponsLoading(true);
    setCouponsError(null);
    try {
      const data = await getMyCoupons(token);
      setAssignedCoupons(data.coupons);
      setCouponsLoaded(true);
    } catch (err) {
      setAssignedCoupons([]);
      setCouponsError(
        err instanceof Error ? err.message : "Could not load your coupons.",
      );
    } finally {
      setCouponsLoading(false);
    }
  }

  async function toggleCoupons() {
    const nextOpen = !couponsOpen;
    setCouponsOpen(nextOpen);
    if (nextOpen) {
      await loadCoupons();
    }
  }

  async function copyCoupon(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      /* ignore */
    }
  }

  function startEditing() {
    setFullName(user.fullName);
    setDateOfBirth(user.dateOfBirth ?? "");
    setGender(user.gender ?? "");
    setProfileError(null);
    setIsEditing(true);
  }

  function cancelEditing() {
    setFullName(user.fullName);
    setDateOfBirth(user.dateOfBirth ?? "");
    setGender(user.gender ?? "");
    setProfileError(null);
    setIsEditing(false);
  }

  async function saveProfile() {
    setProfileError(null);

    const trimmedName = fullName.trim();
    if (trimmedName.length < 2) {
      setProfileError("Please enter your full name.");
      return;
    }

    const trimmedDob = dateOfBirth.trim();
    const parsedDob = trimmedDob === "" ? null : trimmedDob;
    if (parsedDob !== null && !isValidDob(parsedDob)) {
      setProfileError("Please enter a valid date of birth.");
      return;
    }

    const token = getStoredToken();
    if (!token) {
      setProfileError("Your session has expired. Please log in again.");
      return;
    }

    setProfileSaving(true);
    try {
      const result = await updateProfile(token, {
        fullName: trimmedName,
        dateOfBirth: parsedDob,
        gender: gender || null,
      });
      updateUser(result.user);
      setIsEditing(false);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Could not update profile.");
    } finally {
      setProfileSaving(false);
    }
  }

  return (
    <div className="w-full bg-[#FBF9F5]">
      <div className="mx-auto w-full max-w-[880px] px-4 pt-6 pb-8 sm:px-6 sm:pt-8 sm:pb-10 lg:pb-10">
        <section className="mb-6 sm:mb-8">
          <h1 className="font-serif text-[1.75rem] leading-tight font-bold text-[#243028] sm:text-[2rem] lg:text-[2.15rem]">
            My Account
          </h1>
          <p className="mt-1.5 text-[14px] leading-relaxed text-[#5f6f64] sm:text-[15px]">
            Manage your personal information and account security.
            <br />
            Keep your details up to date for a smooth experience.
          </p>
        </section>

        <div className="space-y-5 sm:space-y-6">
          <section className="overflow-hidden rounded-[22px] border border-[#e6ebe3] bg-white shadow-[0_10px_32px_rgba(31,107,58,0.05)]">
            <div className="flex flex-col gap-4 border-b border-[#eef2ee] px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:py-6">
              <CardHeading
                icon={<UserCircleIcon className="h-6 w-6 text-[#1f6b3a]" />}
                title="Personal Information"
                subtitle="Your personal details used for your account."
              />
              {isEditing ? (
                <div className="flex shrink-0 flex-wrap items-center gap-2 self-start">
                  <button
                    type="button"
                    onClick={cancelEditing}
                    disabled={profileSaving}
                    className="inline-flex cursor-pointer items-center justify-center rounded-[12px] border border-[#d7e0d6] bg-white px-4 py-2 text-[13px] font-semibold text-[#3d4a3c] transition hover:bg-[#f6f8f5] disabled:cursor-not-allowed disabled:opacity-60 sm:text-[14px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveProfile}
                    disabled={profileSaving}
                    className={`${memberPrimaryBtnClass} inline-flex cursor-pointer items-center justify-center rounded-[12px] px-4 py-2 text-[13px] sm:text-[14px]`}
                  >
                    {profileSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={startEditing}
                  className="inline-flex shrink-0 cursor-pointer items-center gap-2 self-start rounded-[12px] border border-[#d7e0d6] bg-white px-4 py-2 text-[13px] font-semibold text-[#1f6b3a] transition hover:border-[#1f6b3a] hover:bg-[#f6f8f5] sm:text-[14px]"
                >
                  <PencilIcon className="h-4 w-4" />
                  Edit
                </button>
              )}
            </div>

            {profileError ? (
              <div className="border-b border-[#eef2ee] px-5 py-3 sm:px-6">
                <p className="rounded-[12px] bg-[#fdecec] px-3 py-2 text-[13px] text-[#8a2f2f]">
                  {profileError}
                </p>
              </div>
            ) : null}

            <div className="divide-y divide-[#eef2ee]">
              <EditableInfoRow
                icon={<PersonIcon className="h-5 w-5 text-[#1f6b3a]" />}
                label="Full Name"
                isEditing={isEditing}
                value={user.fullName || "—"}
                editContent={
                  <input
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className={inlineFieldClass}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    maxLength={120}
                  />
                }
              />
              <EditableInfoRow
                icon={<DobIcon className="h-5 w-5 text-[#1f6b3a]" />}
                label="DOB"
                isEditing={isEditing}
                value={formatDob(user.dateOfBirth)}
                editContent={
                  <MemberDatePicker
                    value={dateOfBirth}
                    onChange={setDateOfBirth}
                  />
                }
              />
              <EditableInfoRow
                icon={<GenderIcon className="h-5 w-5 text-[#1f6b3a]" />}
                label="Gender"
                isEditing={isEditing}
                value={formatGender(user.gender)}
                editContent={
                  <MemberSelect
                    value={gender}
                    onChange={(next) => setGender(next as UserGender | "")}
                    placeholder="Select gender"
                    options={[
                      { value: "", label: "Select gender" },
                      ...genderOptions,
                    ]}
                  />
                }
              />
              <InfoRow
                icon={<PhoneIcon className="h-5 w-5 text-[#1f6b3a]" />}
                label="Mobile Number"
                value={formatMobile(user.mobile)}
              />
              <InfoRow
                icon={<MailIcon className="h-5 w-5 text-[#1f6b3a]" />}
                label="Email Address"
                value={user.email || "—"}
              />
              <InfoRow
                icon={<LinkIcon className="h-5 w-5 text-[#1f6b3a]" />}
                label="Personal Access Link"
                value={user.accessLink}
                copyable
              />
            </div>

            <div className="flex items-start gap-2.5 border-t border-[#eef2ee] bg-[#fafbf9] px-5 py-4 sm:px-6">
              <InfoCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#8a9a8d]" />
              <p className="text-[12px] leading-relaxed text-[#6b7c6e] sm:text-[13px]">
                To change your mobile number, OTP verification is required. Email changes, if
                allowed, will also require verification. Your personal access link and referral
                code stay the same if you later update your name.
              </p>
            </div>
          </section>

          <section className="overflow-hidden rounded-[22px] border border-[#e6ebe3] bg-white shadow-[0_10px_32px_rgba(31,107,58,0.05)]">
            <button
              type="button"
              onClick={() => void toggleCoupons()}
              aria-expanded={couponsOpen}
              className="flex w-full cursor-pointer items-center gap-4 px-5 py-5 text-left transition hover:bg-[#fafbf9] sm:px-6 sm:py-5"
            >
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eef6f0] sm:h-12 sm:w-12">
                <TagIcon className="h-5 w-5 text-[#1f6b3a]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold text-[#243028] sm:text-[16px]">
                  View coupon
                </span>
              </span>
              <ChevronRightIcon
                className={`h-5 w-5 shrink-0 text-[#8a9a8d] transition ${
                  couponsOpen ? "rotate-90" : ""
                }`}
              />
            </button>

            {couponsOpen ? (
              <div className="border-t border-[#eef2ee]">
                {couponsError ? (
                  <div className="px-5 py-4 sm:px-6">
                    <p className="rounded-[12px] bg-[#fdecec] px-3 py-2 text-[13px] text-[#8a2f2f]">
                      {couponsError}
                    </p>
                    <button
                      type="button"
                      onClick={() => void loadCoupons(true)}
                      className="mt-3 text-[13px] font-semibold text-[#1f6b3a] hover:underline"
                    >
                      Try again
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-[#eef2ee] bg-[#FBF9F5] text-[11px] font-bold tracking-[0.06em] text-[#6b7c6e] uppercase sm:text-[12px]">
                          <th className="px-5 py-3 font-bold sm:px-6">Code</th>
                          <th className="px-4 py-3 font-bold sm:px-6">Discount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {couponsLoading ? (
                          <tr>
                            <td colSpan={2} className="px-5 py-10 text-center sm:px-6">
                              <div className="flex flex-col items-center justify-center gap-3">
                                <SiteLoader size="md" label="Loading your coupons" />
                                <p className="text-[13px] text-[#6b7c6e] sm:text-[14px]">
                                  Loading your coupons…
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : assignedCoupons.length === 0 ? (
                          <tr>
                            <td colSpan={2} className="px-5 py-8 text-center sm:px-6">
                              <p className="text-[13px] leading-relaxed text-[#6b7c6e] sm:text-[14px]">
                                No coupons are assigned to your account right now.
                              </p>
                            </td>
                          </tr>
                        ) : (
                          assignedCoupons.map((coupon) => (
                            <tr
                              key={coupon.id}
                              className="border-b border-[#eef2ee] last:border-b-0"
                            >
                              <td className="px-5 py-3.5 sm:px-6">
                                <button
                                  type="button"
                                  onClick={() => void copyCoupon(coupon.code)}
                                  title="Click to copy"
                                  className="inline-flex cursor-pointer items-center gap-2 font-mono text-[13px] font-bold tracking-wide text-[#1f6b3a] transition hover:underline sm:text-[14px]"
                                >
                                  {coupon.code}
                                  <span className="text-[11px] font-semibold tracking-normal text-[#8a9a8d] normal-case">
                                    {copiedCode === coupon.code ? "Copied" : ""}
                                  </span>
                                </button>
                              </td>
                              <td className="px-4 py-3.5 text-[13px] font-semibold text-[#243028] sm:px-6">
                                {coupon.discountLabel}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : null}
          </section>

          <section className="overflow-hidden rounded-[22px] border border-[#e6ebe3] bg-white shadow-[0_10px_32px_rgba(31,107,58,0.05)]">
            <div className="border-b border-[#eef2ee] px-5 py-5 sm:px-6 sm:py-6">
              <CardHeading
                icon={<ShieldIcon className="h-6 w-6 text-[#1f6b3a]" />}
                title="Account & Security"
                subtitle="Manage your password and keep your account secure."
              />
            </div>

            <button
              type="button"
              onClick={() => setChangePasswordOpen(true)}
              className="flex w-full cursor-pointer items-center gap-4 px-5 py-5 text-left transition hover:bg-[#fafbf9] sm:px-6 sm:py-5"
            >
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eef6f0] sm:h-12 sm:w-12">
                <LockIcon className="h-5 w-5 text-[#1f6b3a]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold text-[#243028] sm:text-[16px]">
                  Change Password
                </span>
                <span className="mt-1 block text-[13px] leading-relaxed text-[#6b7c6e] sm:text-[14px]">
                  Update your account password regularly for better security.
                </span>
              </span>
              <ChevronRightIcon className="h-5 w-5 shrink-0 text-[#8a9a8d]" />
            </button>
          </section>

          <section className="overflow-hidden rounded-[22px] border border-[#f0e2d8] bg-[#FAF4EF]">
            <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
              <div className="flex items-start gap-4 sm:items-center">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fdeee4] sm:h-12 sm:w-12">
                  <LogOutIcon className="h-5 w-5 text-[#c45c4a]" />
                </span>
                <div>
                  <p className="text-[15px] font-bold text-[#243028] sm:text-[16px]">Log Out</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#6b7c6e] sm:text-[14px]">
                    Securely log out from your account on this device.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={signOut}
                className="inline-flex shrink-0 cursor-pointer items-center justify-center self-start rounded-[14px] border border-[#d9a89a] bg-white px-5 py-2.5 text-[13px] font-semibold text-[#c45c4a] transition hover:bg-[#fff8f6] sm:self-center sm:text-[14px]"
              >
                Log Out
              </button>
            </div>
          </section>
        </div>
      </div>

      <ChangePasswordModal
        open={changePasswordOpen}
        user={user}
        onClose={() => setChangePasswordOpen(false)}
      />
    </div>
  );
}

function CardHeading({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3 sm:gap-4">
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eef6f0] sm:h-12 sm:w-12">
        {icon}
      </span>
      <div>
        <p className="text-[15px] font-bold text-[#243028] sm:text-[16px]">{title}</p>
        <p className="mt-1 text-[13px] leading-relaxed text-[#6b7c6e] sm:text-[14px]">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function EditableInfoRow({
  icon,
  label,
  value,
  isEditing = false,
  editContent,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  isEditing?: boolean;
  editContent?: ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 px-5 py-4 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)] sm:items-center sm:gap-x-6 sm:py-[18px] lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef6f0]">
          {icon}
        </span>
        <span className="text-[13px] font-medium text-[#6b7c6e] sm:text-[14px]">{label}</span>
      </div>
      <div className="pl-12 sm:pl-0">
        {isEditing && editContent ? (
          editContent
        ) : (
          <span className="break-all text-[14px] font-bold text-[#243028] sm:text-[15px]">
            {value}
          </span>
        )}
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  verified = false,
  copyable = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  verified?: boolean;
  copyable?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copyValue() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-2 px-5 py-4 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)] sm:items-center sm:gap-x-6 sm:py-[18px] lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef6f0]">
          {icon}
        </span>
        <span className="text-[13px] font-medium text-[#6b7c6e] sm:text-[14px]">{label}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 pl-12 sm:pl-0">
        <span className="min-w-0 break-all text-[14px] font-bold text-[#243028] sm:text-[15px]">
          {value}
        </span>
        {verified ? (
          <span className="inline-flex rounded-[6px] bg-[#eef6f0] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#1f6b3a] uppercase">
            Verified
          </span>
        ) : null}
        {copyable ? (
          <button
            type="button"
            onClick={copyValue}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-[10px] border border-[#d7e0d6] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#1f6b3a] transition hover:border-[#1f6b3a] hover:bg-[#f6f8f5] sm:text-[13px]"
          >
            {copied ? (
              <>
                <CheckIcon className="h-3.5 w-3.5" />
                Copied
              </>
            ) : (
              <>
                <CopyIcon className="h-3.5 w-3.5" />
                Copy
              </>
            )}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function UserCircleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 17.5c1.2-2.2 2.9-3.5 5-3.5s3.8 1.3 5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function PersonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5.5 19c1.4-3.2 3.8-4.8 6.5-4.8s5.1 1.6 6.5 4.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function DobIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 3.5v3M16 3.5v3M4 10h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function GenderIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M13.5 6.5 18 2M18 2v4.5M18 2h-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M7 18c1.5-2.5 3.8-4 5-4s3.5 1.5 5 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect x="7" y="3.5" width="10" height="17" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 18.5h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M10 13.5 8.8 14.7a3.2 3.2 0 0 1-4.5-4.5L5.5 9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M14 10.5 15.2 9.3a3.2 3.2 0 0 1 4.5 4.5L18.5 15"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path d="M9 15l6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect x="8" y="8" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M6 16V6.5A1.5 1.5 0 0 1 7.5 5H16"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="m5.5 12.5 4 4 9-9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TagIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M20.5 13.2 12.8 20.9a1.8 1.8 0 0 1-2.5 0L3.1 13.7a1.8 1.8 0 0 1 0-2.5L10.8 3.5c.3-.3.8-.5 1.3-.5H19a1.5 1.5 0 0 1 1.5 1.5v6.9c0 .5-.2 1-.5 1.3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="16.2" cy="7.8" r="1.2" fill="currentColor" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M12 3.5 18 6v6c0 4.2-2.6 7.4-6 8.5-3.4-1.1-6-4.3-6-8.5V6l6-2.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect x="5.5" y="10.5" width="13" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="m15.5 5.5 3 3L9 18H6v-3l9.5-9.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LogOutIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M14 7V5.5A1.5 1.5 0 0 0 12.5 4h-7A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20h7A1.5 1.5 0 0 0 14 18.5V17"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M10 12h10m0 0-3-3m3 3-3 3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InfoCircleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 11v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="8" r="0.9" fill="currentColor" />
    </svg>
  );
}
