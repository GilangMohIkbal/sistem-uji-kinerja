"""Regenerate the original UKIN fictional sample PDFs and their exact metadata.

Requires reportlab (authoring only, never a Nuxt runtime dependency).
Run from any directory: python scripts/create-samples.py
"""
from pathlib import Path
from hashlib import sha256
import json

from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "samples"
OUTPUT.mkdir(parents=True, exist_ok=True)
W, H = A4
M = 46
TEAL = HexColor("#007F6D")
DEEP = HexColor("#005C53")
NAVY = HexColor("#142B40")
MUTED = HexColor("#506579")
TINT = HexColor("#E8F7F2")
LINE = HexColor("#D7E2E8")

BODY = ParagraphStyle("body", fontName="Helvetica", fontSize=10.2, leading=15.5, textColor=NAVY)
SMALL = ParagraphStyle("small", parent=BODY, fontSize=8.5, leading=12, textColor=MUTED)
HEAD = ParagraphStyle("heading", parent=BODY, fontName="Helvetica-Bold", fontSize=12, leading=16, textColor=DEEP)


class Sample:
    def __init__(self, name, title, pages):
        self.path = OUTPUT / name
        self.c = canvas.Canvas(str(self.path), pagesize=A4, pageCompression=1, invariant=1)
        self.c.setTitle(title)
        self.c.setAuthor("UKIN PPG UNJ - contoh fiktif")
        self.c.setSubject("Dokumen pedagogi demonstrasi; bukan instrumen atau dokumen resmi.")
        self.pages = pages
        self.n = 0
        self.y = 0

    def para(self, text, style=BODY, gap=9, width=None, x=None):
        width = width or W - 2 * M
        x = M if x is None else x
        p = Paragraph(text, style)
        _, height = p.wrap(width, H)
        if self.y - height < 74:
            raise ValueError(f"Content overflow: {self.path.name}, page {self.n}")
        p.drawOn(self.c, x, self.y - height)
        self.y -= height + gap

    def section(self, number, title, text):
        self.y -= 6
        self.para(f"{number}  {title}", HEAD, gap=8)
        self.para(text)

    def page(self, category, title, subtitle):
        if self.n:
            self.footer()
            self.c.showPage()
        self.n += 1
        self.c.setFillColor(DEEP)
        self.c.rect(0, H-10, W, 10, fill=1, stroke=0)
        self.c.setFillColor(TEAL)
        self.c.setFont("Helvetica-Bold", 11)
        self.c.drawString(M, H-47, "UKIN  /  PPG UNJ")
        self.c.setFont("Helvetica", 8)
        self.c.setFillColor(MUTED)
        self.c.drawRightString(W-M, H-47, "DOKUMEN CONTOH FIKTIF")
        self.c.setStrokeColor(LINE)
        self.c.line(M, H-63, W-M, H-63)
        self.c.setFillColor(TEAL)
        self.c.setFont("Helvetica-Bold", 8.5)
        self.c.drawString(M, H-86, category.upper())
        self.c.setFont("Helvetica-Bold", 25)
        self.c.setFillColor(NAVY)
        self.c.drawString(M, H-119, title)
        self.y = H-135
        self.para(subtitle, SMALL, gap=17)

    def note(self, text):
        p = Paragraph(text, SMALL)
        _, h = p.wrap(W-2*M-26, H)
        self.c.setFillColor(TINT)
        self.c.roundRect(M, self.y-h-24, W-2*M, h+24, 7, fill=1, stroke=0)
        p.drawOn(self.c, M+13, self.y-h-12)
        self.y -= h+38

    def footer(self):
        self.c.setStrokeColor(LINE)
        self.c.line(M, 57, W-M, 57)
        self.c.setFont("Helvetica", 7.5)
        self.c.setFillColor(MUTED)
        self.c.drawString(M, 43, "Data dan situasi fiktif. Bukan dokumen peserta atau standar penilaian resmi.")
        self.c.drawRightString(W-M, 29, f"UKIN demo  |  {self.n} / {self.pages}")

    def save(self):
        self.footer()
        self.c.save()
        assert self.n == self.pages


def perangkat():
    doc = Sample("perangkat-pembelajaran.pdf", "Contoh perangkat pembelajaran: Membandingkan pecahan", 2)
    doc.page("Perangkat pembelajaran / 01", "Memahami ukuran pecahan", "Contoh rancangan pembelajaran matematika SD - materi pecahan sederhana. Alokasi 2 x 35 menit adalah rancangan demo, bukan ketentuan nasional.")
    doc.note("<b>Tujuan contoh.</b> Peserta didik membandingkan pecahan menggunakan keseluruhan yang sama besar, menjelaskan alasan, dan memeriksa kembali jawabannya dengan model visual.")
    doc.section("01", "Konteks dan kebutuhan belajar", "Dalam kelas simulasi, beberapa peserta didik membandingkan pecahan hanya dari pembilang atau penyebut. Pengajar menyiapkan potongan kertas berukuran sama agar makna ukuran bagian dapat diamati. Tidak ada data atau identitas anak nyata dalam dokumen ini.")
    doc.section("02", "Tujuan dan bukti belajar", "Setelah kegiatan, peserta didik diharapkan dapat: (1) menunjukkan satu per dua dan satu per empat pada keseluruhan yang sama; (2) menjelaskan mengapa satu per dua lebih besar; serta (3) membuat satu contoh pembanding lain. Bukti belajar berupa gambar beranotasi dan penjelasan lisan atau tulisan singkat.")
    doc.section("03", "Sumber dan media", "Kertas persegi panjang dengan ukuran sama, pensil warna, papan tulis, dan LKPD contoh yang disediakan bersama paket. Pengajar menyiapkan versi potongan berukuran besar serta pilihan respons lisan untuk kebutuhan akses yang berbeda.")
    doc.section("04", "Pembuka - 10 menit", "Tunjukkan dua kertas sama besar. Lipat kertas pertama menjadi dua bagian dan kertas kedua menjadi empat bagian. Tanyakan: 'Jika mengambil satu bagian dari setiap kertas, apakah ukurannya sama? Bagaimana kamu mengetahuinya?' Catat gagasan awal tanpa memberi label nilai.")
    doc.section("05", "Eksplorasi - 35 menit", "Peserta didik bekerja berpasangan, menandai bagian yang dipilih, lalu meletakkan model berdampingan. Pasangan diminta menjelaskan hubungan jumlah bagian dan ukuran tiap bagian. Pengajar memakai pertanyaan pemandu: 'Apakah keseluruhannya sama besar?' dan 'Apa yang berubah saat jumlah bagiannya bertambah?'")
    doc.page("Perangkat pembelajaran / 02", "Bukti, umpan balik, refleksi", "Lanjutan rancangan pembelajaran fiktif. Penilaian di bawah merupakan asesmen kelas contoh, bukan rubrik UKIN atau keputusan kelulusan.")
    doc.section("06", "Diskusi dan penguatan - 15 menit", "Dua pasangan mempresentasikan model dan alasannya. Pengajar mempertemukan jawaban berbeda, meminta peserta didik menunjuk bukti pada gambar, dan menegaskan syarat keseluruhan yang sama besar. Hindari mengajarkan aturan mekanis sebelum makna model dipahami.")
    doc.section("07", "Penutup - 10 menit", "Minta setiap peserta didik menggambar satu per dua dan satu per empat, memberi tanda perbandingan, dan menulis satu kalimat alasan. Gunakan respons tersebut untuk memilih kebutuhan latihan berikutnya; jangan mengubah jawaban kosong menjadi bukti tidak mampu.")
    doc.section("08", "Asesmen formatif dan tindak lanjut", "Perhatikan tiga hal: konsistensi ukuran keseluruhan pada model, kesesuaian bagian yang diarsir, dan alasan yang merujuk pada ukuran bagian. Jika model berbeda ukuran, ulangi demonstrasi dengan kertas identik. Jika alasan masih berupa hafalan, minta peserta didik menguji contoh baru bersama pasangannya.")
    doc.section("09", "Dukungan dan pengayaan", "Berikan potongan siap lipat kepada peserta didik yang membutuhkan dukungan motorik. Terima respons lisan dengan menunjuk model. Peserta yang sudah memahami membandingkan dua per empat dengan satu per dua dan menyusun penjelasan tentang nilai yang setara.")
    doc.section("10", "Refleksi pengajar", "Setelah pembelajaran, tinjau bukti mana yang membantu menjelaskan perubahan pemahaman dan siapa yang masih membutuhkan dukungan. Catat keterbatasan aktivitas, kecukupan waktu, dan satu perubahan yang akan dicoba. Simpan karya contoh tanpa nama atau foto anak untuk demonstrasi.")
    doc.note("<b>Isi paket contoh.</b> Dokumen utama ini dapat dipasangkan dengan LKPD pecahan dan laporan studi kasus. Seluruh materi disusun khusus untuk mock UKIN; bukan dokumen resmi sekolah atau instrumen penilai.")
    doc.save()


def lkpd():
    doc = Sample("lkpd-pecahan.pdf", "LKPD contoh: Bagian mana lebih besar?", 1)
    doc.page("Lampiran pendukung / LKPD", "Bagian mana lebih besar?", "Matematika SD - pecahan sederhana. Lembar latihan fiktif untuk demonstrasi; kolom respons sengaja kosong dan tidak berisi identitas anak.")
    doc.note("<b>Petunjuk.</b> Gunakan dua keseluruhan yang sama besar. Amati model, lalu jelaskan alasanmu. Kamu boleh menjawab dengan gambar, tulisan, atau penjelasan lisan.")
    doc.para("1  Bandingkan dua model berikut.", HEAD, gap=16)
    y = doc.y-66
    bw, bh = 208, 53
    for x, segments, label in [(M, 2, "Model A: satu per dua"), (W-M-bw, 4, "Model B: satu per empat")]:
        doc.c.setFillColor(TINT)
        doc.c.rect(x, y, bw, bh, fill=1, stroke=0)
        doc.c.setFillColor(TEAL)
        doc.c.rect(x, y, bw/segments, bh, fill=1, stroke=0)
        doc.c.setStrokeColor(DEEP)
        doc.c.setLineWidth(1)
        doc.c.rect(x, y, bw, bh, fill=0, stroke=1)
        for i in range(1,segments):
            doc.c.line(x+i*bw/segments, y, x+i*bw/segments, y+bh)
        doc.c.setFont("Helvetica-Bold", 9.5)
        doc.c.setFillColor(NAVY)
        doc.c.drawString(x, y-19, label)
    doc.y = y-48
    doc.para("Bagian berwarna mana yang lebih besar? Apa yang kamu amati?", gap=11)
    for _ in range(2):
        doc.c.setStrokeColor(LINE); doc.c.line(M,doc.y-10,W-M,doc.y-10); doc.y-=25
    doc.section("2", "Uji dengan model buatanmu", "Gambarlah dua persegi panjang sama besar. Bagi gambar pertama menjadi tiga bagian sama besar dan gambar kedua menjadi enam bagian sama besar. Arsir satu bagian pada setiap gambar.")
    doc.c.setStrokeColor(LINE)
    doc.c.roundRect(M, doc.y-90, W-2*M, 90, 6, fill=0, stroke=1)
    doc.y -= 109
    doc.para("Lengkapi: Saya membandingkan ukuran bagian karena ...", gap=6)
    doc.c.line(M,doc.y-14,W-M,doc.y-14); doc.y-=33
    doc.section("3", "Periksa kembali", "Apakah kedua keseluruhanmu sama besar? Apakah bagian dalam setiap gambar sama besar? Tunjukkan satu bagian gambarmu yang mendukung alasanmu.")
    doc.save()


def kasus():
    doc = Sample("studi-kasus.pdf", "Studi kasus fiktif: Dari hitungan bagian ke ukuran pecahan", 1)
    doc.page("Laporan studi kasus / contoh", "Dari bagian menuju makna", "Refleksi pembelajaran pecahan. Skenario disusun untuk menguji alur pengumpulan bukti UKIN; bukan hasil penelitian atau pengalaman peserta nyata.")
    doc.note("<b>Asal bukti.</b> Semua respons dan kejadian di bawah merupakan narasi simulasi. Tidak ada nama, foto, rekaman, atau data pribadi anak yang digunakan.")
    doc.section("01", "Konteks dan masalah", "Dalam skenario kelas SD, beberapa peserta didik menyatakan satu per empat lebih besar daripada satu per dua karena bilangan empat lebih besar daripada dua. Jawaban awal itu menunjukkan kebutuhan untuk menghubungkan simbol pecahan dengan ukuran bagian dari keseluruhan yang sama.")
    doc.section("02", "Tindakan yang dilakukan", "Pengajar menyediakan dua kertas berukuran sama. Satu kertas dibagi menjadi dua, satu lagi menjadi empat. Peserta didik mengarsir satu bagian, membandingkan model, dan menjelaskan alasan kepada pasangannya. Pertanyaan pengajar menyoroti ukuran keseluruhan dan hubungan jumlah bagian dengan luas setiap bagian.")
    doc.section("03", "Bukti atau hasil", "Pada contoh respons setelah kegiatan, seorang tokoh peserta didik fiktif mengubah alasan dari 'empat lebih besar' menjadi 'setiap bagian lebih kecil ketika kertas yang sama dibagi lebih banyak'. Tokoh lain masih memakai gambar dengan ukuran keseluruhan berbeda. Narasi ini menggambarkan kemungkinan perkembangan dan hambatan, bukan statistik keberhasilan atau temuan empiris.")
    doc.section("04", "Refleksi dan tindak lanjut", "Model konkret membantu diskusi ketika ukuran keseluruhan dijaga tetap. Pengajar perlu memeriksa gambar setiap pasangan sebelum menarik kesimpulan tentang pemahaman. Pertemuan berikutnya akan menggunakan potongan yang identik, pertanyaan pembanding baru, dan pilihan penjelasan lisan. Keterbatasannya: satu aktivitas belum cukup untuk menyimpulkan penguasaan konsep secara menyeluruh.")
    doc.note("<b>Catatan penggunaan.</b> Dokumen dapat dipilih sebagai alternatif laporan teks pada mode participant_report. Pada mode exam_snapshot, tampilan laporan mengikuti data simulasi yang disediakan aplikasi; tidak ada integrasi ke web ujian.")
    doc.save()


perangkat()
lkpd()
kasus()

specs = [
    ("sample-perangkat", "perangkat-pembelajaran.pdf"),
    ("sample-lkpd", "lkpd-pecahan.pdf"),
    ("sample-kasus", "studi-kasus.pdf"),
]
metadata = []
for identifier, name in specs:
    data = (OUTPUT / name).read_bytes()
    metadata.append({"id": identifier, "source": "sample", "name": name, "mime": "application/pdf", "size": len(data), "sampleId": identifier, "sha256": sha256(data).hexdigest()})
module = "import type { EvidenceFile } from '../domain/types.ts'\n\n"
module += "// Original fictional PDFs. Regenerated by scripts/create-samples.py; byte sizes and digests match public/samples.\n"
module += "export const SAMPLE_FILES: EvidenceFile[] = " + json.dumps(metadata, ensure_ascii=False, indent=2) + "\n\n"
module += "export function sampleUrl(id: string): string | null {\n  const sample = SAMPLE_FILES.find(file => file.id === id || file.sampleId === id)\n  return sample ? `/samples/${sample.name}` : null\n}\n"
(ROOT / "app" / "data" / "sample-files.ts").write_text(module, encoding="utf-8")
print(json.dumps(metadata, indent=2))
