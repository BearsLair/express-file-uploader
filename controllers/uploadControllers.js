export async function getLoginPage(req, res) {
  try {
    res.render("login");
  } catch (e) {
    console.error("Cannot retrieve Log In Page: ", e);
  }
}
