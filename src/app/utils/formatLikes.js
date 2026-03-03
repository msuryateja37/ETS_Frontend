export const formatLikes = (likes) => {
  if (likes >= 1_000_000) {
    return (likes / 1_000_000).toFixed(1) + "M+";
  } else if (likes >= 1_000) {
    return (likes / 1_000).toFixed(1) + "K+";
  }
  return likes.toString();
};
