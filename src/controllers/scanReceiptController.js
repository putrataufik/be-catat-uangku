const multer = require("multer");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Konfigurasi multer untuk upload gambar
const upload = multer({ storage: multer.memoryStorage() });
const uploadMiddleware = upload.single("image");

const scanReceipt = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "Gambar nota diperlukan" });
    }

    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return res.status(400).json({ error: "Tipe gambar tidak didukung" });
    }

    const base64Image = Buffer.from(file.buffer).toString("base64");

    const categories = [
           "Makanan & Minuman",
      "Transportasi",
      "Belanja Harian",
      "Pulsa & Internet",
      "Listrik & Air",
      "Parkir",
      "Sewa / Cicilan Rumah",
      "Perabotan & Alat Rumah",
      "Perawatan Rumah",
      "Tagihan Rutin",
      "Pendidikan Anak",
      "Uang Saku",
      "Pengasuhan",
      "Obat-obatan",
      "Periksa Dokter",
      "BPJS / Asuransi",
      "Langganan Streaming",
      "Nonton Bioskop",
      "Nongkrong / Café",
      "Hobi",
      "Donasi / Amal",
      "Zakat / Infaq",
      "Kado / Hadiah",
      "Cicilan / Kredit",
      "Pajak & Denda",
      "Lainnya",
      "Gaji",
      "Bonus",
      "Hasil Usaha",
      "Hadiah",
      "Penjualan Barang",
      "Cashback / Reward",
    ];

    

    const prompt = `Kamu adalah asisten keuangan digital. Saya ingin kamu membaca gambar nota dan mengisi data JSON berikut ini:

{
  "type": (income atau expense, ditentukan dari isi nota),
  "amount": (jumlah total pembelian atau pemasukan dalam angka tanpa simbol),
  "category": (pilih hanya dari daftar kategori di bawah ini),
  "date": (tanggal transaksi dalam format YYYY-MM-DD),
  "note": (deskripsi atau catatan dari nota)
}

Gunakan kategori dari daftar ini saja (jangan membuat kategori sendiri):

${categories}

Petunjuk tambahan:
- Jika nota menunjukkan pembelian barang atau jasa, maka "type" adalah "expense".
- Jika nota menunjukkan gaji, bonus, hadiah, atau uang masuk, maka "type" adalah "income".

Hanya kirimkan hasil dalam format JSON valid saja, tanpa markdown atau tambahan teks.`;


    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "models/gemini-2.0-flash" });

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Image,
          mimeType: file.mimetype,
        },
      },
      prompt,
    ]);

    const validCategories = [
      "Makanan & Minuman",
      "Transportasi",
      "Belanja Harian",
      "Pulsa & Internet",
      "Listrik & Air",
      "Parkir",
      "Sewa / Cicilan Rumah",
      "Perabotan & Alat Rumah",
      "Perawatan Rumah",
      "Tagihan Rutin",
      "Pendidikan Anak",
      "Uang Saku",
      "Pengasuhan",
      "Obat-obatan",
      "Periksa Dokter",
      "BPJS / Asuransi",
      "Langganan Streaming",
      "Nonton Bioskop",
      "Nongkrong / Café",
      "Hobi",
      "Donasi / Amal",
      "Zakat / Infaq",
      "Kado / Hadiah",
      "Cicilan / Kredit",
      "Pajak & Denda",
      "Lainnya",
      "Gaji",
      "Bonus",
      "Hasil Usaha",
      "Hadiah",
      "Penjualan Barang",
      "Cashback / Reward",
    ];

    const text = result.response.text();
    const cleaned = text.replace(/```json|```/g, "").trim();
    // Validasi JSON
    let json;
    try {
      json = JSON.parse(cleaned);
      // Validasi kategori
      if (!validCategories.includes(json.category)) {
        return res.status(400).json({
          error: "Kategori tidak valid",
          acceptedCategories: validCategories,
          receivedCategory: json.category,
        });
      }
    } catch (e) {
      return res
        .status(400)
        .json({ error: "harap memasukan gambar nota valid", raw: text });
    }

    res.status(200).json({
      message: "Berhasil membaca nota",
      note: json,
    });
  } catch (err) {
    console.error("❌ Error scan nota:", err.message);
    res.status(500).json({ error: "Gagal memproses gambar nota" });
  }
};

module.exports = {
  uploadMiddleware,
  scanReceipt,
};
