path = r'h:\project\frontend\app\register\page.js'
content = open(path, 'rb').read().decode('utf-8')

old = """  const onSubmitPatient = async (values) => {
    setPatientSubmitting(true);
    try {
      // Step 1: Request OTP via email
      await api.post("/auth/send-otp/", { phone: values.phone, email: values.email });
      setPatientData({
        username: values.email.split("@")[0] || `user${Date.now()}`,
        password: values.password, email: values.email,
        first_name: values.first_name, last_name: values.last_name, phone: values.phone, role: "PATIENT",
        date_of_birth: values.dateOfBirth || null, gender: values.gender || null,
        blood_group: values.bloodGroup || null, address: values.address || null,
        known_allergies: values.knownAllergies || null,
        emergency_contact_name: values.emergencyContactName || null,
        emergency_contact_phone: values.emergencyContactPhone || null,
      });
      setShowOtp(true);
      toast.success("Verification code sent to your email!");
    } catch (error) {
      const msg = error?.response?.data?.message || "Failed to send OTP";
      toast.error(msg);
    } finally {
      setPatientSubmitting(false);
    }
  };"""

new = """  const onSubmitPatient = async (values) => {
    setPatientSubmitting(true);
    try {
      // Step 1: Request OTP via SMS
      const res = await api.post("/auth/send-otp/", { phone: values.phone, email: values.email });
      setPatientData({
        username: values.email.split("@")[0] || `user${Date.now()}`,
        password: values.password, email: values.email,
        first_name: values.first_name, last_name: values.last_name, phone: values.phone, role: "PATIENT",
        date_of_birth: values.dateOfBirth || null, gender: values.gender || null,
        blood_group: values.bloodGroup || null, address: values.address || null,
        known_allergies: values.knownAllergies || null,
        emergency_contact_name: values.emergencyContactName || null,
        emergency_contact_phone: values.emergencyContactPhone || null,
      });
      setShowOtp(true);

      // Dev mode: backend returns OTP directly when SMS is unavailable (Twilio trial)
      const devOtp = res?.data?.data?.dev_otp;
      if (devOtp) {
        setOtpValue(String(devOtp));
        toast("⚠️ Dev mode: OTP auto-filled from server (" + devOtp + ")", { duration: 8000, icon: "🔑" });
      } else {
        toast.success("Verification code sent to your phone!");
      }
    } catch (error) {
      const msg = error?.response?.data?.message || "Failed to send OTP";
      toast.error(msg);
    } finally {
      setPatientSubmitting(false);
    }
  };"""

if old in content:
    content = content.replace(old, new, 1)
    open(path, 'wb').write(content.encode('utf-8'))
    print('SUCCESS: Frontend patch applied.')
else:
    print('ERROR: Target block not found.')
    # show lines around onSubmitPatient
    for i, line in enumerate(content.splitlines(), 1):
        if 198 <= i <= 222:
            print(i, repr(line))
