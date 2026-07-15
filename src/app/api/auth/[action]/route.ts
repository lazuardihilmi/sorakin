import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, comparePassword, setAuthCookie, deleteAuthCookie, getCurrentUser } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;

  if (action === "session") {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    return NextResponse.json({ authenticated: true, user });
  }

  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;
  const body = await request.json().catch(() => ({}));

  if (action === "register") {
    const { email, password, confirmPassword, agreement } = body;

    if (!email || !password || !confirmPassword) {
      return NextResponse.json({ error: "Semua form harus diisi." }, { status: 400 });
    }

    if (!agreement) {
      return NextResponse.json({ error: "Anda harus menyetujui Syarat & Ketentuan." }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Format email tidak valid." }, { status: 400 });
    }

    // Validate password strength: more than 8 chars, uppercase, lowercase, number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json({
        error: "Password harus minimal 8 karakter, mengandung huruf besar, huruf kecil, dan angka."
      }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({
        error: "Password dan konfirmasi belum cocok. Coba dicek lagi, ya."
      }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 400 });
    }

    // Generate unique name and username based on email
    const emailUsername = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const generatedUsername = `${emailUsername}${randomSuffix}`;

    const hashedPassword = await hashPassword(password);

    // Create User
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name: email.split("@")[0],
        username: generatedUsername,
        isVerified: false,
      },
    });

    // Auto-login after registration
    await setAuthCookie(user.id, user.email);

    return NextResponse.json({
      success: true,
      message: "Registrasi berhasil.",
      user: { id: user.id, email: user.email, name: user.name, username: user.username }
    });
  }

  if (action === "login") {
    const { identifier, password } = body; // identifier can be email or username

    if (!identifier || !password) {
      return NextResponse.json({ error: "Email/username dan password harus diisi." }, { status: 400 });
    }

    // Find user by email or username
    const user = await db.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier }
        ]
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Email/username atau password salah." }, { status: 401 });
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "Email/username atau password salah." }, { status: 401 });
    }

    await setAuthCookie(user.id, user.email);

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, username: user.username }
    });
  }

  if (action === "google-mock") {
    const { email, name } = body;

    if (!email || !name) {
      return NextResponse.json({ error: "Data Google tidak lengkap." }, { status: 400 });
    }

    // Check if user already exists
    let user = await db.user.findUnique({ where: { email } });

    if (!user) {
      const emailUsername = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const generatedUsername = `${emailUsername}${randomSuffix}`;
      
      const randomPassword = await hashPassword(Math.random().toString(36) + "Sorakin2026!");

      user = await db.user.create({
        data: {
          email,
          password: randomPassword,
          name,
          username: generatedUsername,
          isVerified: false,
        },
      });
    }

    await setAuthCookie(user.id, user.email);

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, username: user.username }
    });
  }

  if (action === "logout") {
    await deleteAuthCookie();
    return NextResponse.json({ success: true, message: "Logged out successfully" });
  }

  if (action === "change-password") {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentPassword, newPassword, confirmNewPassword } = body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return NextResponse.json({ error: "Semua form kata sandi harus diisi." }, { status: 400 });
    }

    const isCurrentValid = await comparePassword(currentPassword, user.password);
    if (!isCurrentValid) {
      return NextResponse.json({ error: "Kata sandi saat ini salah." }, { status: 400 });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return NextResponse.json({
        error: "Password baru harus minimal 8 karakter, mengandung huruf besar, huruf kecil, dan angka."
      }, { status: 400 });
    }

    if (newPassword === currentPassword) {
      return NextResponse.json({ error: "Password baru tidak boleh sama dengan password saat ini." }, { status: 400 });
    }

    if (newPassword !== confirmNewPassword) {
      return NextResponse.json({ error: "Password baru dan konfirmasi belum cocok." }, { status: 400 });
    }

    const hashedNew = await hashPassword(newPassword);

    await db.user.update({
      where: { id: user.id },
      data: { password: hashedNew }
    });

    return NextResponse.json({ success: true, message: "Kata sandi berhasil diperbarui." });
  }

  if (action === "verify-account") {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: { isVerified: true }
    });

    return NextResponse.json({
      success: true,
      message: "Akun Anda telah diverifikasi! Badge verifikasi sekarang aktif.",
      user: { id: updatedUser.id, email: updatedUser.email, isVerified: updatedUser.isVerified }
    });
  }

  if (action === "update-profile") {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, username, phone } = body;

    // Validate username uniqueness if changed
    let updatedUsername = user.username;
    if (username && username !== user.username) {
      const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
      if (cleanUsername.length < 3) {
        return NextResponse.json({ error: "Username minimal 3 karakter alfanumerik." }, { status: 400 });
      }
      const existing = await db.user.findFirst({
        where: { username: cleanUsername, id: { not: user.id } }
      });
      if (existing) {
        return NextResponse.json({ error: "Username sudah digunakan." }, { status: 400 });
      }
      updatedUsername = cleanUsername;
    }

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        name: name || user.name,
        username: updatedUsername,
        phone: phone !== undefined ? phone : user.phone
      }
    });

    return NextResponse.json({
      success: true,
      message: "Profil pribadi berhasil diperbarui.",
      user: { id: updatedUser.id, name: updatedUser.name, username: updatedUser.username, phone: updatedUser.phone }
    });
  }

  return NextResponse.json({ error: "Action not supported" }, { status: 400 });
}
