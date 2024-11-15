
class UserState {
    constructor() {
        this.isLoggedIn = false;
        this.userData = null;
        this.init();
    }

    init() {
        const savedUser = localStorage.getItem('userData');
        if (savedUser) {
            this.userData = JSON.parse(savedUser);
            this.isLoggedIn = true;
        }
        this.updateUI();
    }

    login(userData) {
        this.userData = userData;
        this.isLoggedIn = true;
        localStorage.setItem('userData', JSON.stringify(userData));
        this.updateUI();
    }

    logout() {
        this.userData = null;
        this.isLoggedIn = false;
        localStorage.removeItem('userData');
        this.updateUI();
    }

    updateUI() {
        const userAccount = document.getElementById('userAccount');
        const loginButton = document.getElementById('loginButton');
        const userProfile = document.getElementById('userProfile');
        const guestProfile = document.getElementById('guestProfile');

        if (this.isLoggedIn && this.userData) {
            userAccount.style.display = 'block';
            loginButton.style.display = 'none';
            userProfile.style.display = 'block';
            guestProfile.style.display = 'none';

            document.getElementById('userName').textContent = this.userData.name;
            document.querySelector('.profile-name').textContent = this.userData.name;
            document.querySelector('.profile-id').textContent = this.userData.id;
            document.querySelector('.profile-bio').textContent = this.userData.bio;

            if (this.userData.profileImage) {
                document.getElementById('profileImage').src = this.userData.profileImage;
            }
        } else {
            userAccount.style.display = 'none';
            loginButton.style.display = 'block';
            userProfile.style.display = 'none';
            guestProfile.style.display = 'block';
        }
    }
}