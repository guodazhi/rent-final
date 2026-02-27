exports.handler = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify([
      {
        title: "Test Room",
        price: 800,
        location: "西安",
        contact: "微信",
        description: "测试房源"
      }
    ])
  };
};