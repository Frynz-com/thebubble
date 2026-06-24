import type { LucideIcon } from "lucide-react";
import { Beer, Car, Dumbbell, Gift, Shirt, Trophy } from "lucide-react";

export type Challenge = {
  id: string;
  title: string;
  kicker: string;
  body: string;
  prize: string;
  participants: number;
  image: string;
};

export type Benefit = {
  id: string;
  title: string;
  description: string;
  meta: string;
  action: string;
  tag: string;
  image?: string;
  icon: LucideIcon;
  sponsor?: string;
  code?: string;
  hint?: string;
  variant?: "primary" | "secondary" | "tertiary";
};

export type Post = {
  id: string;
  author: string;
  time: string;
  text: string;
  avatar: string;
};

export type BubblePerson = {
  id: string;
  name: string;
  avatar: string;
  active?: boolean;
};

export const partnerConfig = {
  appName: "The Bubble",
  partnerName: "TSV Stuttgart",
  eventName: "Matchday",
  hubName: "Community Hub",
  sponsor: "Auto-Zentrum Stuttgart",
  homeTeam: "TSV Stuttgart",
  awayTeam: "SV Cannstatt",
  colors: {
    surface: "#f9f9ff",
    primary: "#0058be",
    primaryContainer: "#2170e4",
    secondary: "#b61722",
    tertiary: "#924700",
  },
  images: {
    hero:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAaD6MngeX1NupzEp-scHVINOZQBi1OLRGTTFP0OUo7_F5neSIv1qMuXfL8FqMLPbTa2D7l4XbDXda7eKzzBdw9i7WKxhE2fdOZt6rkllVWAsmqT48IA8KheiF0UGC5jYUnD8AjthDraaNqww-0J2aCFNztsN5fIgMCK0QHWhgQkJ664wkaSw3Nbo6JoXWZ19D8SkIYAC_ePo_kOWtwyYehGL603IydBU-l157Ad6JjsbcxRGpdBNtl2kpof2r_4DBWsn2tQLnFspo",
    avatars: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAxvJjpDByIpHE19syqms3x3ZhLQ11UniRttfc3AWyMO3PMxkrL8YDO7cpiLF_GQbUGeMCAKqRwgOPI_3agJWRy3ZxN-oBkFpppHZz4R-XMBMAZi4QaCA53Vhj4HhUsLJLAynEN2nkxGrNpWvVcHkJYUlbWlp_2aHr217o-L_oGAStdJZEO97qIqeiGmR2lzGEDpDmN0gkt_HzGGUlLv5wEZ4OgrYLXbtpURPUyg_pUVbp8FLK0QRCq02in0f4XQB1RTVIBfQLkMuI",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAjdJKzuoUj85k-TyAjmIGVAAsjDDXWBrWxSA1KYwPWZ61ouFasc20cDkDapPziEvxRKCmN9Z4jAzGzeNObvUCYXjPV5tRWHSQxpbVh6D6hhksYJDp9L6UjD6Ggk6nYKtjg7ex8gwIj6gq-hn-gzo3LdN-CZ7-sU5bg67GncrTLcXq60PLG1-iW3-rEXEywBFrOBG8IpZfHePTzcU0bdTnw_MtcTLoT8-2mGFIu2fCeRx7Y5Q-4dd2B5Sk68PKbrCP9Yf8Uajr8Xls",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCJr5GzM1PY2lNMrKPd2nploY41D8C0lBVcvUOEf27wo42HBdYz2SJ-Fo7tCKSANcvOpeyUF6W98D_9t6_2LN1pGbfwK3M6L4kf-WBckNyfbF2PWJ9AX2qL_VmVeX5CDU-_Xa4giK8ofbG2eexaffqYMUvS98KpalmOF1mkzLLIUQEEa7axlHqk_bR_eeuLVTvD6qcdi5eIU8ukG68ss5dK0ZVDBIbQ9Rldq_vyBJseBgz8cvFI8NL9pJopcDhfMbaA9lTMkLqwsaQ",
    ],
    user:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDbD52YYzcHQPqQ-pjucNaeBDa5u8zGhxF7GL1lKMKm8FAkTND3SXcjAConeDO8Rcz8qfWBx_lpBSbaap0BI8fgL61-hpSBgjg_tge10Ft4XwclD8VnhWGiSwfddCVcm0HxOtCGooP0AThq9IUbV-NJXb6WeI9NPSumOyFXqXIpN2qVo_gZSfSS1vPgwXi-mZjP7eNGvaXGvbNEsXJZZzPIMA7xYdIO1lQ7pXYaK3q6xDJbG-RygvvqFSfzB6j9MIQRfCBeB6TigMY",
    onboarding:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAo9ipMkcfSlAufRkVVhDI3TpSwtaTb1pF_k_KyHexNncMHqzoStcWnFJMUBnaHD86ZYp0Gl8PXs-FNDzPL4h8R2RuuLrS6lrAcsHaES_LzPTc3VbyTsIkhzt5Arc6XbnGLkarTb5yFkF7sCxC_-_pHxvAYA7jVwPhc2fqqsJIN1nhKi6bMWGN5XcmA9iRYGKrj4va1b2vGLjrhGLD6gvmw9Neynuw-LOw5NYKlwAGueM34Qkqmp_GkC-w1UIbZauLALvVo2yy1qbw",
  },
  challenges: [
    {
      id: "fanmoment",
      title: "Zeig deinen Fanmoment",
      kicker: "Live Challenge",
      body: "Poste deinen besten Moment vom Spieltag und sichere dir deine Gewinnchance.",
      prize: "Gewinne ein Heimtrikot mit Wunschflock.",
      participants: 42,
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAgM-OapwKYXdpZrGtT0P60RwiC4Oa9JHOEqKW-Y8_lNcclxWVU7LymFxfBIys-glMkGrXytnVaHjV7hTaYf7NXSeMhZqldKnJiRLBGNHf-cmaqTyhByTirKcsiZQeW1x-RUluClNsnwldEYkc7Kr1szdM981tf-AdJMhnOvydHapKMFCX9dXvjh5bLrkx8mkm5XY5QIUge5z1hK6zwWcTjHyD_r_uWRebQ4BNw1iAjIJkC9FYFdVWyu-TtuRCz9Z5hXqqfjOYcWD0",
    },
  ] satisfies Challenge[],
  benefits: [
    {
      id: "drink",
      title: "10% Rabatt auf das nächste Getränk",
      description: "Gültig im Vereinsheim bei Vorlage dieses digitalen Coupons an Spieltagen.",
      meta: "Heute bis 22:00",
      action: "Einlösen",
      tag: "Bar",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuC5_jTYU8BYAyrK3ft1mZD-_zUHiKYfZXFqp-plvB89u-qV976KWgSQry3I2ceOf0n18EWnzheBaoQsomaMhphsKcAipk7L7FJm54_Le8GS1tIfDFuTKWp2Dy8EE9vDBntADb93kzizEuSquER8W65ZpTRhFwPKqFV901Rauf25ApXBl9cAxx0REcSEW3xFL2jGoKc2VfS9MEAnSVigPgXCWeSxQ_re9fpKk0yyk7eq1iEi6KztFLrhYcKEZwIeGG2hAyQK_svWRBU",
      icon: Beer,
      variant: "secondary",
    },
    {
      id: "jersey",
      title: "Gewinnspiel für ein Vereinstrikot",
      description: "Nimm teil und gewinne das neue Heimtrikot der Saison 23/24 inklusive Wunschflock.",
      meta: "Ziehung am 01. Juli",
      action: "Einlösen",
      tag: "Gewinnspiel",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCd3az4kYu7awmBDJuknQl6yna24w3bMJr7DgzGdQKBWMVOpL5KCsfONBJiOjomuxRjclQNs7z-43FJTopE3i4yq90B760klE-xPbKXOzWErY8pHDbN0eqC-xz5HluLPiXkREWIqIdLLibQcRgD1zu5T7y_pHz_Q-zdPGk1147SPgh60dt45nnqOmOBqfAFkRyq5fOSircR2g5474QYMVNVybvtuQT2pxd3uvYPL-d-7VhVoxXFR7-BLwP087MzNblySmfYm9l88-M",
      icon: Shirt,
      variant: "tertiary",
    },
    {
      id: "service",
      title: "50 Euro Gutschein für Service & Wartung",
      description: "Exklusiv für TSV-Mitglieder. Einlösbar bei deiner nächsten Inspektion.",
      meta: "Premium Partner",
      action: "Einlösen",
      tag: "Partner",
      icon: Car,
      sponsor: "Auto-Zentrum Stuttgart",
    },
    {
      id: "training",
      title: "Kostenloses Probetraining",
      description: "Entdecke unsere neuen Fitness-Kurse im TSV-Center.",
      meta: "TSV-Center",
      action: "Einlösen",
      tag: "Jetzt starten",
      icon: Dumbbell,
      variant: "secondary",
    },
  ] satisfies Benefit[],
  people: [
    {
      id: "max",
      name: "Max",
      active: true,
      avatar:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDmK-NVl5-WhxlNJr2jrkrKQBDBJD5ozUb-Ilo-IxeAeba6Pe05Q0AWzt7AhlEDTex-oEpmLVHjguIEZ1fjbW-y40IBw56nJI6CgqbX3aakXgaUxcZERTRX-93JiCUkGJP7Cs39w8VuiPxSoIhZbnLbeZmP2Lffik2pvNnw_7AsBKQng0x25n0ziayFOY5d-S8gKihTBwEP9VL2iVMP3y8zyqtQS7GNbPTFnnFrs0KIvrnHyoDRAEW51HNwzcPdyQRMKCzXWVvJLuQ",
    },
    {
      id: "lea",
      name: "Lea",
      active: true,
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAxvJjpDByIpHE19syqms3x3ZhLQ11UniRttfc3AWyMO3PMxkrL8YDO7cpiLF_GQbUGeMCAKqRwgOPI_3agJWRy3ZxN-oBkFpppHZz4R-XMBMAZi4QaCA53Vhj4HhUsLJLAynEN2nkxGrNpWvVcHkJYUlbWlp_2aHr217o-L_oGAStdJZEO97qIqeiGmR2lzGEDpDmN0gkt_HzGGUlLv5wEZ4OgrYLXbtpURPUyg_pUVbp8FLK0QRCq02in0f4XQB1RTVIBfQLkMuI",
    },
    {
      id: "sarah",
      name: "Sarah",
      avatar:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAfHzXIaFg-3gSDgfsXnh8SIkMq0wAE5-7_zs49vVGiv7S7P8LjyZDW4ogWVe1JFFewG3yDnIdV-4dvs-rVBl8zlmEwXK8xsDMJGmNfMsgMdbHbhXQSFnbYGLoI57ogY4NqiLxlZU48sAH2wE1IX_xDWIhOQcnpREjeFLMjGTBfaDKefzzGeZUMPuXgHeNwaeT23QCcdQbnF3WCFAvTsDKOELxc2anqRQask2mq4so8_Q2gfyo98yjW815alCjDenntQ18JvKXKkHM",
    },
    {
      id: "timo",
      name: "Timo",
      active: true,
      avatar:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCJr5GzM1PY2lNMrKPd2nploY41D8C0lBVcvUOEf27wo42HBdYz2SJ-Fo7tCKSANcvOpeyUF6W98D_9t6_2LN1pGbfwK3M6L4kf-WBckNyfbF2PWJ9AX2qL_VmVeX5CDU-_Xa4giK8ofbG2eexaffqYMUvS98KpalmOF1mkzLLIUQEEa7axlHqk_bR_eeuLVTvD6qcdi5eIU8ukG68ss5dK0ZVDBIbQ9Rldq_vyBJseBgz8cvFI8NL9pJopcDhfMbaA9lTMkLqwsaQ",
    },
    {
      id: "jules",
      name: "Jules",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAjdJKzuoUj85k-TyAjmIGVAAsjDDXWBrWxSA1KYwPWZ61ouFasc20cDkDapPziEvxRKCmN9Z4jAzGzeNObvUCYXjPV5tRWHSQxpbVh6D6hhksYJDp9L6UjD6Ggk6nYKtjg7ex8gwIj6gq-hn-gzo3LdN-CZ7-sU5bg67GncrTLcXq60PLG1-iW3-rEXEywBFrOBG8IpZfHePTzcU0bdTnw_MtcTLoT8-2mGFIu2fCeRx7Y5Q-4dd2B5Sk68PKbrCP9Yf8Uajr8Xls",
    },
  ] satisfies BubblePerson[],
  posts: [
    {
      id: "1",
      author: "Max Weber",
      time: "gerade eben",
      text: "Die Stimmung ist heute komplett da. Wer steht noch Block C?",
      avatar:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDmK-NVl5-WhxlNJr2jrkrKQBDBJD5ozUb-Ilo-IxeAeba6Pe05Q0AWzt7AhlEDTex-oEpmLVHjguIEZ1fjbW-y40IBw56nJI6CgqbX3aakXgaUxcZERTRX-93JiCUkGJP7Cs39w8VuiPxSoIhZbnLbeZmP2Lffik2pvNnw_7AsBKQng0x25n0ziayFOY5d-S8gKihTBwEP9VL2iVMP3y8zyqtQS7GNbPTFnnFrs0KIvrnHyoDRAEW51HNwzcPdyQRMKCzXWVvJLuQ",
    },
    {
      id: "2",
      author: "Sarah Berger",
      time: "vor 2 Std.",
      text: "Erstes Mal über die Bubble dabei. Fühlt sich richtig gut an.",
      avatar:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAfHzXIaFg-3gSDgfsXnh8SIkMq0wAE5-7_zs49vVGiv7S7P8LjyZDW4ogWVe1JFFewG3yDnIdV-4dvs-rVBl8zlmEwXK8xsDMJGmNfMsgMdbHbhXQSFnbYGLoI57ogY4NqiLxlZU48sAH2wE1IX_xDWIhOQcnpREjeFLMjGTBfaDKefzzGeZUMPuXgHeNwaeT23QCcdQbnF3WCFAvTsDKOELxc2anqRQask2mq4so8_Q2gfyo98yjW815alCjDenntQ18JvKXKkHM",
    },
  ] satisfies Post[],
  success: {
    title: "Du bist dabei!",
    body: "Deine Teilnahme wurde gespeichert. Die Ziehung erfolgt am 01. Juli.",
    prize: "Deine Gewinnchance",
  },
};

export function getBubbleBranding(slug: string) {
  if (slug === "demo") {
    return {
      partnerName: "The Bubble Demo",
      eventName: "Matchday Demo",
      heroImage: "/images/demo-stadium.jpg",
      logoImage: "",
      socialProof: "42 Personen sind gerade dabei",
    };
  }

  if (slug === "testbubble") {
    return {
      partnerName: "Test Bubble",
      eventName: "Internal Test",
      heroImage: "",
      logoImage: "",
      socialProof: "Test-Bubble ist bereit",
    };
  }

  if (slug === "huber-arena") {
    return {
      partnerName: "Huber Arena",
      eventName: "Public Viewing",
      heroImage: "/images/huber-arena-cover.png",
      logoImage: "/images/huber-arena-logo.png",
      socialProof: "Public Viewing in der Huber Arena",
    };
  }

  return {
    partnerName: "The Bubble",
    eventName: "Live",
    heroImage: "",
    logoImage: "",
    socialProof: "Live vor Ort",
  };
}

export const successIcon = Trophy;
export const fallbackBenefitIcon = Gift;
