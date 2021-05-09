// https://gist.github.com/Tomcc/a96af509e275b1af483b25c543cfbf37
export enum PaletteType {
  Paletted1 = 1, // 32 blocks per word
  Paletted2 = 2, // 16 blocks per word
  Paletted3 = 3, // 10 blocks and 2 bits of padding per word
  Paletted4 = 4, // 8 blocks per word
  Paletted5 = 5, // 6 blocks and 2 bits of padding per word
  Paletted6 = 6, // 5 blocks and 2 bits of padding per word
  Paletted8 = 8, // 4 blocks per word
  Paletted16 = 16, // 2 blocks per word
}
