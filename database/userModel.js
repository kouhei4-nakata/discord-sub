const prisma = require('./dbClient.js');

module.exports = {
    createUser: async function(userId, stripeCustomerId, email, plan) {
        const user = await prisma.user.create({
            data: {
                userId: userId,
                stripeCustomerId: stripeCustomerId,
                email: email,
                plan: plan
            },
        });
        return user;
    },
    // 他の必要なメソッドをここに追加します
};