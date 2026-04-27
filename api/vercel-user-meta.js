export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");
  res.status(200).json({
    projectId: "prj_spBJ549Ln40F2i0NUReVfALNOr9k",
    orgId: "team_Ox0ffmJXBBYXXxPXL28rQxwH",
    projectName: "leocare-mcp",
  });
}
