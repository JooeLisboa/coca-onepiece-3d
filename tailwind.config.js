/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cokeRed: "#F40009",
        // Cores extraídas da imagem de Whisky Peak
        desertSand: "#E3C195", // Areia clara
        whiskyRock: "#8B4513", // Marrom avermelhado das rochas
        skyBlue: "#A4C8E1", // Céu claro e desbotado
        cactusGreen: "#4A5D23", // Verde seco
      },
      fontFamily: {
        condensed: ['"Oswald"', "sans-serif"],
        epic: ['"Cinzel"', "serif"],
      },
      backgroundImage: {
        // Um degradê que simula o calor: Areia em baixo, céu claro em cima
        "whisky-peak":
          "linear-gradient(to bottom, #87CEEB 0%, #E3C195 60%, #8B4513 100%)",
      },
    },
  },
  plugins: [],
};
