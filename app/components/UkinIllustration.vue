<script setup lang="ts">
defineProps<{ compact?: boolean }>()
</script>

<template>
  <div class="evidence-art" :class="{ compact }" aria-hidden="true">
    <div class="orbit orbit-one" /><div class="orbit orbit-two" />
    <div class="art-spark spark-one">✦</div><div class="art-spark spark-two">✦</div>
    <div class="evidence-paper">
      <div class="paper-top"><span>CATATAN PRAKTIK BAIK</span><span>01 / UKIN</span></div>
      <div class="paper-title">Dari rencana,<br>menjadi bermakna.</div>
      <div class="paper-rule" /><div class="paper-rule short" />
      <div class="lesson-drawing">
        <svg viewBox="0 0 260 150" fill="none">
          <path d="M32 126h190" stroke="#B8DAD0" stroke-width="2" />
          <rect x="41" y="20" width="139" height="89" rx="8" fill="#E8F7F2" stroke="#007F6D" stroke-width="3" />
          <path d="m73 108-9 18m92-18 9 18M62 43h65M62 54h43" stroke="#007F6D" stroke-width="4" stroke-linecap="round" />
          <rect x="65" y="77" width="15" height="17" rx="4" fill="#80CEB9" />
          <rect x="89" y="66" width="15" height="28" rx="4" fill="#3AAE94" />
          <rect x="113" y="58" width="15" height="36" rx="4" fill="#007F6D" />
          <circle cx="190" cy="51" r="15" fill="#E8BC94" />
          <path d="M175 50c-2-21 31-25 31 0-10-3-14-8-17-12-3 7-7 10-14 12Z" fill="#142B40" />
          <path d="M169 96c0-17 7-27 20-27 15 0 24 10 24 27v30h-44V96Z" fill="#007F6D" />
          <path d="m177 76-18 17-22-9" stroke="#E8BC94" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" />
          <path d="m183 124-4 14m22-14 3 14" stroke="#142B40" stroke-width="9" stroke-linecap="round" />
          <path d="m148 41 6 6 11-12" stroke="#007F6D" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
      <div class="paper-bottom"><span>Rencanakan. Praktikkan. Refleksikan.</span><span>PPG / UNJ</span></div>
    </div>
    <div class="video-note"><span class="play-mark"><svg viewBox="0 0 24 24" fill="currentColor"><path d="m9 5 11 7-11 7V5Z" /></svg></span><div><strong>Praktik yang nyata</strong><span>Video pembelajaran</span></div><span class="video-bars"><i /><i /><i /><i /><i /></span></div>
    <div class="reflection-note"><span class="reflection-number">03</span><div><strong>Ruang refleksi</strong><span>Belajar dari pengalaman.</span></div></div>
    <div class="art-caption"><span class="caption-dot" /> Satu paket. Tiga sudut pandang.</div>
  </div>
</template>

<style scoped>
.evidence-art{position:relative;isolation:isolate;width:100%;min-height:510px;display:grid;place-items:center;overflow:hidden;border-radius:28px;background:radial-gradient(ellipse at 85% 10%,#179681 0,transparent 49%),linear-gradient(145deg,#063D39,#007F6D);color:white}
.orbit{position:absolute;z-index:-1;border:1px solid #d7fff220;border-radius:50%;width:440px;height:440px;left:50%;top:49%;transform:translate(-50%,-50%)}.orbit-two{width:340px;height:340px;border-style:dashed}.art-spark{position:absolute;color:#80ead1;font-size:30px}.spark-one{top:40px;right:38px}.spark-two{bottom:94px;left:42px;font-size:22px}
.evidence-paper{width:70%;max-width:360px;background:#fff;color:#142B40;padding:24px 25px 18px;border-radius:10px;box-shadow:7px 9px 0 #acd9cc,14px 23px 0 #032e2a55;transform:rotate(-7deg);margin-top:-18px;animation:paper-enter .8s ease both}.paper-top{display:flex;align-items:center;justify-content:space-between;gap:16px;font-size:7px;font-weight:800;letter-spacing:1px;color:#007F6D}.paper-title{font-size:25px;font-weight:750;line-height:1.2;margin:20px 0 15px;letter-spacing:-.7px}.paper-rule{height:3px;width:83%;background:#d7e2e8;border-radius:2px;margin:7px 0}.paper-rule.short{width:58%}.lesson-drawing{margin:4px -9px 0}.lesson-drawing svg{display:block;width:100%}.paper-bottom{border-top:1px solid #d7e2e8;padding-top:12px;display:flex;justify-content:space-between;gap:10px;font-size:6px;font-weight:700;color:#506579}.video-note{position:absolute;right:18px;top:85px;display:flex;gap:12px;align-items:center;background:#fff;padding:15px 18px;border-radius:12px;box-shadow:0 12px 30px #032e2a30;transform:rotate(6deg);color:#142B40}.video-note strong,.reflection-note strong{display:block;font-size:12px}.video-note span:not(.play-mark,.video-bars),.reflection-note div span{display:block;font-size:10px;margin-top:3px;color:#506579}.play-mark{width:36px;height:36px;display:grid;place-items:center;border-radius:50%;background:#e8f7f2;color:#007F6D}.play-mark svg{width:22px;height:22px}.video-bars{display:flex;gap:3px;align-items:center;margin-left:3px}.video-bars i{display:block;width:3px;height:13px;border-radius:2px;background:#007F6D}.video-bars i:nth-child(2),.video-bars i:nth-child(4){height:22px}.video-bars i:nth-child(3){height:31px}.reflection-note{position:absolute;left:27px;bottom:100px;display:flex;gap:13px;align-items:center;background:#E8F7F2;color:#142B40;padding:15px 21px;border-radius:12px;transform:rotate(5deg);box-shadow:0 8px 20px #032e2a20}.reflection-number{font-size:25px;font-weight:750;color:#007F6D}.art-caption{position:absolute;bottom:34px;left:0;right:0;display:flex;gap:9px;justify-content:center;align-items:center;color:#d5fff1;font-size:11px;letter-spacing:.2px}.caption-dot{width:5px;height:5px;background:#52e0bf;border-radius:50%}.compact{min-height:400px;background:transparent;border-radius:0}.compact .evidence-paper{max-width:300px}.compact .video-note{top:46px;right:0}.compact .reflection-note{bottom:61px;left:8px}.compact .art-caption{bottom:0}.compact .orbit-one{width:350px;height:350px}.compact .orbit-two{width:280px;height:280px}.compact .spark-two{left:5px;bottom:130px}
@keyframes paper-enter{from{opacity:0;transform:translateY(15px) rotate(-4deg)}to{opacity:1;transform:translateY(0) rotate(-7deg)}}
@media(max-width:600px){.evidence-art{min-height:410px}.evidence-paper{padding:21px 20px 15px;max-width:290px}.paper-title{font-size:23px}.video-note{right:10px;top:55px;padding:12px;gap:8px}.video-bars{display:none}.reflection-note{left:14px;bottom:79px;padding:12px 16px}.art-caption{bottom:25px}.spark-one{top:20px;right:26px}.compact{min-height:340px}.compact .evidence-paper{max-width:265px}.compact .video-note{top:33px}.compact .reflection-note{bottom:44px}}
@media(prefers-reduced-motion:reduce){.evidence-paper{animation:none}}
</style>
