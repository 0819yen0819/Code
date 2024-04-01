/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts,scss,js}"],
  important: true,
  theme: {
    extend: {
      borderWidth: {
        0.5: "0.5px",
      },
      screens: {
        xxs: "0px",
        xs: "426px",
      },
    },
  },
  plugins: [],
};
