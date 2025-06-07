const { GoogleGenerativeAI } = require("@google/generative-ai");
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);

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

const categoryListText = categories.map((c) => `- ${c}`).join("\n");

const voiceReceipt = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Teks hasil voice tidak ditemukan" });
    }

    const prompt = `Kamu adalah asisten keuangan digital. Saya akan memberikan teks hasil voice yang berisi catatan pengeluaran atau pemasukan. Tugas kamu adalah mengubahnya menjadi format JSON dengan struktur sebagai berikut:

{
  "type": (income atau expense),
  "amount": (jumlah total dalam angka, tanpa simbol),
  "category": (hanya dari daftar kategori di bawah ini),
  "date": (tanggal dalam format YYYY-MM-DD),
  "note": (deskripsi transaksi)
}

📌 Ketentuan penting untuk field \"date\":
- Jika tanggal lengkap disebutkan (misalnya: 5 Juni 2024), konversi ke format YYYY-MM-DD.
- Jika hanya disebutkan frasa seperti \"hari ini\", \"kemarin\", atau \"besok\", tuliskan saja frasa itu di date

📌 Gunakan kategori hanya dari daftar berikut (jangan buat kategori baru):

${categoryListText}

Teks voice: """${text}"""

Kirimkan output dalam format JSON valid. Jangan tambahkan penjelasan atau teks lain.`;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "models/gemini-2.0-flash" });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleaned = responseText.replace(/```json|```/g, "").trim();

    let json;
    try {
      json = JSON.parse(cleaned);

      // Validasi kategori
      if (!categories.includes(json.category)) {
        return res.status(400).json({
          error: "Kategori tidak valid",
          acceptedCategories: categories,
          receivedCategory: json.category,
        });
      }

      // Konversi frasa tanggal ke format YYYY-MM-DD
      if (typeof json.date === 'string') {
        const lowerDate = json.date.toLowerCase().trim();
        const today = dayjs();

        if (lowerDate === 'hari ini') {
          json.date = today.format('YYYY-MM-DD');
        } else if (lowerDate === 'kemarin') {
          json.date = today.subtract(1, 'day').format('YYYY-MM-DD');
        } else if (lowerDate === 'besok') {
          json.date = today.add(1, 'day').format('YYYY-MM-DD');
        }
      }

    } catch (e) {
      return res.status(400).json({ error: "Gagal parsing respons AI", raw: responseText });
    }

    res.status(200).json({
      message: "Berhasil membaca teks voice",
      note: json,
    });
  } catch (err) {
    console.error("\u274c Error voiceReceipt:", err.message);
    res.status(500).json({ error: "Terjadi kesalahan saat memproses teks voice" });
  }
};

module.exports = { voiceReceipt };