const isAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token || token !== 'test123') {
        return res.redirect('https://google.com');
    }

    next();
};

module.exports =  isAuth ;