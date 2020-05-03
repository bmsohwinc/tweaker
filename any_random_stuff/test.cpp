#include <bits/stdc++.h>
using namespace std;


class Solution {
public:
    string reformat(string s) {
        
        string alpha, numer;
        
        int cn, ca;
        cn = ca = 0;
        
        for (int i=0; i<s.size(); i++) {
            if (s[i] >= '0' and s[i] <= '9') {
                cn++;
                numer += s[i];
            }
            else {
                ca++;
                alpha += s[i];
            }
        }
        
        if ((ca > cn + 1) or (cn > ca + 1)) {
            cout << "\n";
        }
        else {
                
            int i,j,k;
            string fin;
            i = j = k = 0;

            for (i=0;i<s.size();i++) {
                if (i % 2 == 0) {
                    fin += alpha[j];
                    j++;
                }
                else {
                    fin += numer[k];
                    k++;
                }
            }

            if (j < alpha.size()) {
                fin += alpha[j];
                j++;
            }
            
            if (k < numer.size()) {
                fin += numer[k];
                k++;
            }
            
            cout << fin << "\n";
        }
        
    }
};