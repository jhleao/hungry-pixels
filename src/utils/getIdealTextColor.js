export default function getIdealTextColor(rgb) {
  const brightness = Math.round(
    (parseInt(rgb.r) * 299 + parseInt(rgb.g) * 587 + parseInt(rgb.b) * 114) /
      1000
  );
  const textColor = brightness > 125 ? 'black' : 'white';
  return textColor;
}
