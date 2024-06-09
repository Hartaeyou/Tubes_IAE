from flask import Flask, render_template, request
import os
import supabase

app = Flask(__name__)

supabase_url = "https://utzdhilbitfcdeljnctj.supabase.co"
supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0emRoaWxiaXRmY2RlbGpuY3RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTE3MjAyOTQsImV4cCI6MjAyNzI5NjI5NH0.oTHeYvKzSEGcoBu8pbMMeDWvbzmwiEFIzEUQBUmbgKk"
supabase_client = supabase.create_client(supabase_url, supabase_key)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/register', methods=['POST'])
def register():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        print("Email:", email)  
        print("Password:", password)  

        # Debugging: Cek hasil query
        existing_user = supabase_client.table('login_tubes').select('id').eq('email', email).execute()
        print("Existing user:", existing_user.json())
        if 'error' in existing_user.data:
            return 'Error: ' + existing_user.data['error']
        elif len(existing_user.data) > 0:
            return 'Email sudah terdaftar!'
        else:
            # Menyisipkan data ke Supabase
            result = supabase_client.table('login_tubes').insert({'email': email, 'password': password}).execute()

            if 'error' in result.json():
                return 'Error: ' + result.json()['error']
            else:
                return 'Registrasi berhasil!'

if __name__ == '__main__':
    app.run(debug=True, port=2000)
